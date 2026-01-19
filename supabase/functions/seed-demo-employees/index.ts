import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Norwegian first names and last names for demo data
const firstNames = [
  'Emma', 'Nora', 'Olivia', 'Ella', 'Maja', 'Emilie', 'Sofie', 'Leah', 'Ingrid', 'Sara',
  'William', 'Noah', 'Oliver', 'Emil', 'Lucas', 'Liam', 'Magnus', 'Henrik', 'Oskar', 'Filip',
  'Ida', 'Thea', 'Aurora', 'Anna', 'Amalie', 'Linnea', 'Mia', 'Frida', 'Julie', 'Hedda',
  'Jakob', 'Theodor', 'Aksel', 'Mathias', 'Sebastian', 'Benjamin', 'Elias', 'Isak', 'Jonas', 'Alexander'
]

const lastNames = [
  'Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen',
  'Jensen', 'Karlsen', 'Johnsen', 'Pettersen', 'Eriksen', 'Berg', 'Haugen', 'Hagen', 'Johannessen',
  'Andreassen', 'Jacobsen', 'Dahl', 'Jørgensen', 'Henriksen', 'Lund', 'Halvorsen', 'Sørensen',
  'Jakobsen', 'Moen', 'Gundersen', 'Iversen', 'Strand'
]

const departments = [
  'd1000000-0000-0000-0000-000000000001', // Produksjon
  'd1000000-0000-0000-0000-000000000002', // Butikk
  'd1000000-0000-0000-0000-000000000003', // Administrasjon
  'd1000000-0000-0000-0000-000000000004', // Lager
]

const employeeTypes = ['fast', 'deltid', 'tilkalling', 'vikar']

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@demo.crewplan.no`
}

function generatePhone(): string {
  return `4${Math.floor(10000000 + Math.random() * 90000000)}`
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting demo employee seeding...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Use service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const createdEmployees: string[] = []
    const errors: string[] = []

    // Create 30 demo employees
    for (let i = 1; i <= 30; i++) {
      const firstName = getRandomElement(firstNames)
      const lastName = getRandomElement(lastNames)
      const fullName = `${firstName} ${lastName}`
      const email = generateEmail(firstName, lastName, i)
      const phone = generatePhone()
      const departmentId = getRandomElement(departments)
      const employeeType = getRandomElement(employeeTypes)

      console.log(`Creating employee ${i}: ${fullName} (${email})`)

      try {
        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'demo1234',
          email_confirm: true,
          user_metadata: {
            full_name: fullName
          }
        })

        if (authError) {
          console.error(`Error creating auth user for ${email}:`, authError.message)
          errors.push(`${email}: ${authError.message}`)
          continue
        }

        if (!authData.user) {
          console.error(`No user returned for ${email}`)
          errors.push(`${email}: No user returned`)
          continue
        }

        const userId = authData.user.id

        // Update profile with additional info
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name: fullName,
            phone,
            department_id: departmentId,
            employee_type: employeeType,
            is_active: true
          })
          .eq('id', userId)

        if (profileError) {
          console.error(`Error updating profile for ${email}:`, profileError.message)
          errors.push(`${email} profile: ${profileError.message}`)
        }

        // Create employee_details record
        const { error: detailsError } = await supabaseAdmin
          .from('employee_details')
          .insert({
            employee_id: userId,
            salary_type: 'hourly',
            contracted_hours_per_week: employeeType === 'fast' ? 37.5 : (employeeType === 'deltid' ? 20 : null),
            employment_percentage: employeeType === 'fast' ? 100 : (employeeType === 'deltid' ? 50 : null),
            accumulated_hours: Math.floor(Math.random() * 2000),
            allow_mobile_clock: true
          })

        if (detailsError) {
          console.error(`Error creating employee_details for ${email}:`, detailsError.message)
          errors.push(`${email} details: ${detailsError.message}`)
        }

        createdEmployees.push(fullName)
        console.log(`Successfully created employee: ${fullName}`)

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`Unexpected error for employee ${i}:`, err)
        errors.push(`Employee ${i}: ${errorMessage}`)
      }
    }

    console.log(`Seeding complete. Created ${createdEmployees.length} employees.`)

    return new Response(
      JSON.stringify({
        success: true,
        created: createdEmployees.length,
        employees: createdEmployees,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Seeding failed:', error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
