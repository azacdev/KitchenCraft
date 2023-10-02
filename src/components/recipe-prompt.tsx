"use client";

import { PromptContext } from "@/context/prompt";
import { useChat } from "ai/react";
import { KeyboardEventHandler, useCallback, useContext, useRef } from "react";
import RecipeIngredients from "./recipe-ingredients";
import RecipeSuggestions from "./recipe-suggestions";
import { Card } from "./ui/card";
import { Command, CommandInput } from "./ui/command";
import { RecipeConfigurator } from "./recipe-configurator";
import { ScrollArea } from "./ui/scroll-area";
import { Label } from "./ui/label";
import { sendTo } from "xstate";

export function RecipePrompt() {
  return (
    <Card className={`flex flex-col bg-slate-50 max-h-full m-4`}>
      <div className="p-3 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-2">
          <Label htmlFor="prompt" className="leading-5 w-full">
            <span>
              Enter <strong>ingredients</strong> or <strong>recipe</strong>
              <br />
              to get suggestions.
            </span>
          </Label>
          <RecipeConfigurator />
        </div>
        <div>
          <RecipeCommand />
        </div>
      </div>
    </Card>
  );
}

const RecipeCommand = () => {
  const promptRef = useRef<HTMLInputElement>(null);
  const prompt$ = useContext(PromptContext);
  const { input, setInput, append } = useChat({
    id: "suggestions",
    api: "/api/recipes",
  });

  const handleFocus = useCallback(() => {
    prompt$.setKey("focused", true);
  }, [prompt$]);

  const handleBlur = useCallback(() => {
    prompt$.setKey("focused", false);
  }, [prompt$]);

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const value = promptRef.current?.value;
      if (e.key === "Enter" && value && value !== "") {
        e.preventDefault();
        console.log("setting", value);
        prompt$.setKey("text", value);
        console.log({ value });
        append({ content: value, role: "user" });
        promptRef.current.value = "";
      }
    },
    [prompt$, append]
  );

  return (
    <Command shouldFilter={false}>
      <RecipeIngredients />
      <CommandInput
        ref={promptRef}
        name="prompt"
        value={input}
        onValueChange={setInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="(e.g. leftover pizza, eggs and feta)"
      />
      <ScrollArea style={{ maxHeight: "50vh" }}>
        <RecipeSuggestions />
      </ScrollArea>
    </Command>
  );
};

// function RecipeSuggestion({
//   name,
//   description,
// }: {
//   name: string;
//   description: string;
// }) {}