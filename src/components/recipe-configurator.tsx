"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  COOKING_TIMES,
  COOKWARES,
  CUISINES,
  TECHNIQUES,
} from "@/data/constants";
import { cn } from "@/lib/utils";
import { map } from "nanostores";
import { createContext, forwardRef } from "react";
import ingredients from "../data/ingredients.json";
import { AttributeBadge } from "./attribute-badge";
import { Label } from "./ui/label";

const RecipeConfiguratorCategory = forwardRef<
  React.ElementRef<typeof AccordionItem>,
  React.ComponentPropsWithoutRef<typeof AccordionItem>
>(({ className, ...props }, ref) => (
  <AccordionItem
    ref={ref}
    className={cn("px-4 max-h-full", className)}
    {...props}
  />
));
RecipeConfiguratorCategory.displayName = "RecipeConfiguratorCategory";

const defaultStore = map({
  ingredients: [],
});

const RecipeConfiguratorContext = createContext(defaultStore);

// export const RecipeConfigurator = ({
//   store,
// }: {
//   store?: typeof defaultStore;
// }) => {
//   const $ = store || defaultStore;

//   const { open } = useStore($, { keys: ["open"] });

//   return (
//     <RecipeConfiguratorContext.Provider value={$}>
//       <Popover>
//         <PopoverTrigger asChild>
//           <Button variant={open ? "default" : "outline"} className="w-16">
//             <Settings2Icon className={!open ? "transform rotate-90" : ""} />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent>
//           <RecipeConfiguratorContent />
//         </PopoverContent>
//       </Popover>
//     </RecipeConfiguratorContext.Provider>
//   );
// };

export const RecipeConfigurator = () => {
  return (
    <Accordion type="single" defaultValue="ingredients" className="max-h-full">
      <AccordionItem value="ingredients">
        <RecipeConfiguratorMenuTrigger>
          Ingredients 🥔
        </RecipeConfiguratorMenuTrigger>
        <RecipeConfiguratorMenuContent>
          <Ingredients />
        </RecipeConfiguratorMenuContent>
      </AccordionItem>
      <AccordionItem value="cuisines">
        <RecipeConfiguratorMenuTrigger>
          Cuisines 🍛
        </RecipeConfiguratorMenuTrigger>
        <RecipeConfiguratorMenuContent>
          <Cuisines />
        </RecipeConfiguratorMenuContent>
      </AccordionItem>
    </Accordion>
  );
};

const RecipeConfiguratorMenuTrigger = forwardRef<
  React.ElementRef<typeof AccordionTrigger>,
  React.ComponentPropsWithoutRef<typeof AccordionTrigger>
>(({ className, children, ...props }, ref) => (
  <AccordionTrigger
    ref={ref}
    className={cn("group px-3", className)}
    {...props}
  >
    {children}
  </AccordionTrigger>
));
RecipeConfiguratorMenuTrigger.displayName = AccordionTrigger.displayName;

const RecipeConfiguratorMenuContent = forwardRef<
  React.ElementRef<typeof AccordionContent>,
  React.ComponentPropsWithoutRef<typeof AccordionContent>
>(({ className, ...props }, ref) => (
  <AccordionContent
    ref={ref}
    style={{ maxHeight: "35vh" }}
    className={cn(
      "text-left flex flex-col gap-4 overflow-y-scroll px-3",
      className
    )}
    {...props}
  />
));
RecipeConfiguratorMenuContent.displayName = AccordionContent.displayName;

const Measures = () => {
  return (
    <RecipeConfiguratorCategory value="measures">
      <AccordionTrigger>Measures 📏</AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-wrap flex-row gap-2 p-3">
          <AttributeBadge attrKey="metric" attrType="measure">
            metric (e.g. grams, ml)
          </AttributeBadge>
          <AttributeBadge attrKey="metrics" attrType="measure">
            imperial (e.g. cup, quart)
          </AttributeBadge>
        </div>
      </AccordionContent>
    </RecipeConfiguratorCategory>
  );
};

const Cuisines = () => {
  return (
    <div className="flex flex-wrap flex-row gap-2 p-3">
      {CUISINES.map((val) => (
        <AttributeBadge attrType="cuisines" attrKey={val} key={val}>
          {val}
        </AttributeBadge>
      ))}
    </div>
  );
};

const Timing = () => {
  return (
    <RecipeConfiguratorCategory value="timing">
      <AccordionTrigger>Timing ⏲️</AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-wrap flex-row gap-2 p-3">
          {COOKING_TIMES.map((val) => (
            <AttributeBadge attrType="timing" attrKey={val} key={val}>
              {val}
            </AttributeBadge>
          ))}
        </div>
      </AccordionContent>
    </RecipeConfiguratorCategory>
  );
};

const Cookware = () => {
  return (
    <RecipeConfiguratorCategory value="cookware">
      <AccordionTrigger>Cookware 🫕</AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-wrap flex-row gap-2 p-3">
          {COOKWARES.map((val) => (
            <AttributeBadge attrType="cookware" attrKey={val} key={val}>
              {val}
            </AttributeBadge>
          ))}
        </div>
      </AccordionContent>
    </RecipeConfiguratorCategory>
  );
};

const Techniques = () => {
  return (
    <RecipeConfiguratorCategory value="techniques">
      <AccordionTrigger>Techniques 🍳</AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-wrap flex-row gap-2 p-3">
          {TECHNIQUES.map((val) => (
            <AttributeBadge attrType="technique" attrKey={val} key={val}>
              {val}
            </AttributeBadge>
          ))}
        </div>
      </AccordionContent>
    </RecipeConfiguratorCategory>
  );
};

const Ingredients = () => {
  const categoriesMap = ingredients.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) {
      acc[ingredient.category] = [];
    }
    acc[ingredient.category].push(ingredient.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <>
      {Object.entries(categoriesMap).map(([category, items]) => (
        <div key={category} className="flex flex-col gap-3">
          <Label className="mb-2 text-muted-foreground uppercase font-medium">
            {category}
          </Label>
          <div className="flex flex-wrap flex-row gap-2">
            {items.map((item) => {
              return (
                <AttributeBadge
                  key={item}
                  attrType="ingredients"
                  attrKey={item}
                >
                  {item}
                </AttributeBadge>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
};
