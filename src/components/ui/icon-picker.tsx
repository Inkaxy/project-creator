import { useState } from "react";
import {
  Building2,
  UtensilsCrossed,
  ChefHat,
  Coffee,
  Warehouse,
  Truck,
  Package,
  Users,
  Briefcase,
  HeadphonesIcon,
  ShoppingCart,
  Store,
  Wrench,
  Settings,
  Factory,
  Hammer,
  HardHat,
  Shirt,
  Sparkles,
  Leaf,
  FlameKindling,
  IceCream,
  Croissant,
  Pizza,
  Soup,
  Wine,
  Beer,
  Salad,
  Sandwich,
  Cake,
  Cookie,
  CakeSlice,
  CircleDollarSign,
  Receipt,
  ClipboardList,
  FileText,
  BarChart3,
  PieChart,
  Home,
  Building,
  Landmark,
  Car,
  Bike,
  Ship,
  Plane,
  Train,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface IconOption {
  name: string;
  icon: LucideIcon;
  category: string;
}

const ICON_LIBRARY: IconOption[] = [
  // Bygninger & Fasiliteter
  { name: "building-2", icon: Building2, category: "Bygninger" },
  { name: "building", icon: Building, category: "Bygninger" },
  { name: "home", icon: Home, category: "Bygninger" },
  { name: "landmark", icon: Landmark, category: "Bygninger" },
  { name: "warehouse", icon: Warehouse, category: "Bygninger" },
  { name: "factory", icon: Factory, category: "Bygninger" },
  { name: "store", icon: Store, category: "Bygninger" },
  
  // Mat & Drikke
  { name: "utensils-crossed", icon: UtensilsCrossed, category: "Mat & Drikke" },
  { name: "chef-hat", icon: ChefHat, category: "Mat & Drikke" },
  { name: "coffee", icon: Coffee, category: "Mat & Drikke" },
  { name: "pizza", icon: Pizza, category: "Mat & Drikke" },
  { name: "soup", icon: Soup, category: "Mat & Drikke" },
  { name: "wine", icon: Wine, category: "Mat & Drikke" },
  { name: "beer", icon: Beer, category: "Mat & Drikke" },
  { name: "salad", icon: Salad, category: "Mat & Drikke" },
  { name: "sandwich", icon: Sandwich, category: "Mat & Drikke" },
  { name: "ice-cream", icon: IceCream, category: "Mat & Drikke" },
  
  // Bakeri & Konditori
  { name: "croissant", icon: Croissant, category: "Bakeri" },
  { name: "cake", icon: Cake, category: "Bakeri" },
  { name: "cake-slice", icon: CakeSlice, category: "Bakeri" },
  { name: "cookie", icon: Cookie, category: "Bakeri" },
  { name: "flame-kindling", icon: FlameKindling, category: "Bakeri" },
  
  // Logistikk & Transport
  { name: "truck", icon: Truck, category: "Transport" },
  { name: "package", icon: Package, category: "Transport" },
  { name: "car", icon: Car, category: "Transport" },
  { name: "bike", icon: Bike, category: "Transport" },
  { name: "ship", icon: Ship, category: "Transport" },
  { name: "plane", icon: Plane, category: "Transport" },
  { name: "train", icon: Train, category: "Transport" },
  
  // Administrasjon & Kontor
  { name: "users", icon: Users, category: "Administrasjon" },
  { name: "briefcase", icon: Briefcase, category: "Administrasjon" },
  { name: "headphones", icon: HeadphonesIcon, category: "Administrasjon" },
  { name: "clipboard-list", icon: ClipboardList, category: "Administrasjon" },
  { name: "file-text", icon: FileText, category: "Administrasjon" },
  { name: "bar-chart-3", icon: BarChart3, category: "Administrasjon" },
  { name: "pie-chart", icon: PieChart, category: "Administrasjon" },
  { name: "circle-dollar-sign", icon: CircleDollarSign, category: "Administrasjon" },
  { name: "receipt", icon: Receipt, category: "Administrasjon" },
  
  // Butikk & Salg
  { name: "shopping-cart", icon: ShoppingCart, category: "Butikk" },
  
  // Vedlikehold & Teknisk
  { name: "wrench", icon: Wrench, category: "Teknisk" },
  { name: "settings", icon: Settings, category: "Teknisk" },
  { name: "hammer", icon: Hammer, category: "Teknisk" },
  { name: "hard-hat", icon: HardHat, category: "Teknisk" },
  
  // Annet
  { name: "shirt", icon: Shirt, category: "Annet" },
  { name: "sparkles", icon: Sparkles, category: "Annet" },
  { name: "leaf", icon: Leaf, category: "Annet" },
];

// Map for quick lookup
const ICON_MAP: Record<string, LucideIcon> = {};
ICON_LIBRARY.forEach((item) => {
  ICON_MAP[item.name] = item.icon;
});

export function getIconComponent(iconName: string | null): LucideIcon {
  if (!iconName) return Building2;
  return ICON_MAP[iconName] || Building2;
}

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color = "#3B82F6" }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const SelectedIcon = getIconComponent(value);

  const filteredIcons = ICON_LIBRARY.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const groupedIcons = filteredIcons.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, IconOption[]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12"
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: color + "20" }}
          >
            <SelectedIcon className="h-4 w-4" style={{ color }} />
          </div>
          <span className="text-muted-foreground">Velg ikon</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Søk etter ikon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-3 space-y-4">
            {Object.entries(groupedIcons).map(([category, icons]) => (
              <div key={category}>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {category}
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {icons.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          onChange(item.name);
                          setOpen(false);
                        }}
                        className={cn(
                          "h-9 w-9 rounded-md flex items-center justify-center hover:bg-accent transition-colors",
                          value === item.name && "bg-accent ring-2 ring-primary"
                        )}
                        title={item.name}
                      >
                        <Icon className="h-4 w-4" style={{ color }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {Object.keys(groupedIcons).length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Ingen ikoner funnet
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
