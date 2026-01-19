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

// Department and function mappings
const departmentConfig = [
  { 
    id: 'd1000000-0000-0000-0000-000000000001', 
    name: 'Produksjon',
    functions: ['f1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000004'] // Stek Natt, Vekkgjøring, Baker, Bollemaskin
  },
  { 
    id: 'd1000000-0000-0000-0000-000000000002', 
    name: 'Butikk',
    functions: ['f1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000007'] // Butikk, Butikk Kveld, Kasse
  },
  { 
    id: 'd1000000-0000-0000-0000-000000000003', 
    name: 'Administrasjon',
    functions: ['f1000000-0000-0000-0000-000000000009'] // Kontor
  },
  { 
    id: 'd1000000-0000-0000-0000-000000000004', 
    name: 'Lager',
    functions: ['f1000000-0000-0000-0000-000000000008'] // Lagerarbeider
  },
]

const employeeTypes: string[] = ['fast', 'deltid', 'tilkalling', 'vikar']

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  return `${firstName.toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'a')}.${lastName.toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'a')}${index}@demo.crewplan.no`
}

function generatePhone(): string {
  return `4${Math.floor(10000000 + Math.random() * 90000000)}`
}

function generateStartDate(): string {
  // Random start date between 2020 and 2025
  const year = 2020 + Math.floor(Math.random() * 5)
  const month = 1 + Math.floor(Math.random() * 12)
  const day = 1 + Math.floor(Math.random() * 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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

    // First, delete existing demo users
    console.log('Deleting existing demo users...')
    const { data: existingDemoUsers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .like('email', '%@demo.crewplan.no')

    if (existingDemoUsers && existingDemoUsers.length > 0) {
      const demoUserIds = existingDemoUsers.map(u => u.id)
      console.log(`Found ${demoUserIds.length} existing demo users to delete`)

      // Delete related records first
      await supabaseAdmin.from('employee_details').delete().in('employee_id', demoUserIds)
      await supabaseAdmin.from('user_roles').delete().in('user_id', demoUserIds)
      
      // Delete auth users
      for (const userId of demoUserIds) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }
      console.log('Deleted existing demo users')
    }

    const createdEmployees: Array<{ name: string; department: string; function: string }> = []
    const errors: string[] = []

    // Create 30 demo employees with balanced distribution across departments
    const employeesPerDept = Math.floor(30 / departmentConfig.length)
    let employeeIndex = 0

    for (const dept of departmentConfig) {
      const count = dept.name === 'Produksjon' ? 12 : (dept.name === 'Butikk' ? 10 : (dept.name === 'Lager' ? 5 : 3))
      
      for (let i = 0; i < count; i++) {
        employeeIndex++
        const firstName = getRandomElement(firstNames)
        const lastName = getRandomElement(lastNames)
        const fullName = `${firstName} ${lastName}`
        const email = generateEmail(firstName, lastName, employeeIndex)
        const phone = generatePhone()
        const functionId = getRandomElement(dept.functions)
        const employeeType = getRandomElement(employeeTypes)
        const startDate = generateStartDate()

        console.log(`Creating employee ${employeeIndex}: ${fullName} (${email}) - ${dept.name}`)

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

          // Update profile with additional info including department and function
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              full_name: fullName,
              phone,
              department_id: dept.id,
              function_id: functionId,
              employee_type: employeeType,
              start_date: startDate,
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

          // Create user_roles record (all demo users are 'ansatt')
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'ansatt'
            })

          if (roleError) {
            console.error(`Error creating user_role for ${email}:`, roleError.message)
            errors.push(`${email} role: ${roleError.message}`)
          }

          createdEmployees.push({ name: fullName, department: dept.name, function: functionId })
          console.log(`Successfully created employee: ${fullName} in ${dept.name}`)

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          console.error(`Unexpected error for employee ${employeeIndex}:`, err)
          errors.push(`Employee ${employeeIndex}: ${errorMessage}`)
        }
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
