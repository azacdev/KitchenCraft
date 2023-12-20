"use client";

// In your specific TypeScript file
declare global {
  interface Window {
    removePromptListener?: () => {}; // Optional property to handle cases where it might not be set
  }
}

import { Badge } from "@/components/display/badge";
import AutoResizableTextarea from "@/components/input/auto-resizable-textarea";
import { Button } from "@/components/input/button";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { getPlatformInfo } from "@/lib/device";
import { assert, cn } from "@/lib/utils";
import { ArrowLeftIcon, ChevronRight, CommandIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEventHandler,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CraftContext } from "../context";

export const AppInstallContainer = ({ children }: { children: ReactNode }) => {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const { isInPWA } = getPlatformInfo(navigator.userAgent);
    if (isInPWA) {
      setInstalled(true);
    }
  }, [setInstalled]);

  return !installed ? <>{children}</> : <></>;
};

// Once the client loads, we rely on browser back calls instead of
// form action post to calculate back
export const BackButton = ({
  handleBack,
  hasHistory,
}: {
  handleBack: () => Promise<void>;
  hasHistory: boolean;
}) => {
  const [showLink, setShowLink] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setShowLink(false);
  }, [showLink]);

  const Content = () => (
    <Button
      variant="ghost"
      type="submit"
      onClick={() => {
        if (hasHistory) {
          router.back();
        } else {
          router.push("/");
        }
      }}
    >
      <ArrowLeftIcon />
    </Button>
  );

  return showLink ? (
    <form action={handleBack}>
      <Content />
    </form>
  ) : (
    <Content />
  );
};

export const CraftInput = ({
  commandBadge,
  className,
}: {
  commandBadge: boolean;
  className?: string;
}) => {
  const initialParam = useSearchParams();
  const [initialValue] = useState(initialParam.get("prompt") || "");
  const [autoFocus] = useState(initialParam.get("crafting") === "1");

  // Cleanup the listener set up to add the crafting class if user clicks #prompt before react loads
  useEffect(() => {
    assert(
      window.removePromptListener,
      "expected removePromptListener to be set when rendered"
    );
    window.removePromptListener();
    // assert("removePromptListener";
  }, []);

  const send = useSend();
  const handleBlur = useCallback(() => {
    send({ type: "BLUR_PROMPT" });
  }, [send]);

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      send({ type: "SET_INPUT", value: e.target.value });
    },
    [send]
  );

  const handleFocus = useCallback(() => {
    send({ type: "FOCUS_PROMPT" });
  }, [send]);

  return (
    <div
      className={cn(
        "flex flex-row gap-2 items-center w-full relative",
        className
      )}
    >
      <ChevronRight className="ml-4 h-4 w-4 shrink-0 opacity-50 self-start mt-2" />
      <AutoResizableTextarea
        id="prompt"
        initialValue={initialValue}
        autoFocus={autoFocus}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        placeholderComponent={
          <div className="flex flex-row w-full h-full relative justify-end items-center">
            <div className="flex flex-col flex-1 items-start">
              <span className="font-semibold text-sm">What to make?</span>
              <div className="flex flex-row gap-1 text-muted-foreground text-xs">
                <span>ingredients</span>
                <span>•</span>
                <span>tags</span>
              </div>
            </div>
            {commandBadge && (
              <Badge variant="secondary" className="mr-10">
                <CommandIcon size={14} />
                <span style={{ fontSize: "14px" }}>K</span>
              </Badge>
            )}
            {/* <Image
              className="w-12 aspect-square absolute right-[3px]"
              src="/apple-touch-icon.png"
              alt="KitchenCraft Logo"
              width={512}
              height={512}
            /> */}
          </div>
        }
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
        
            function handleFocus() {
              document.body.classList.add('crafting');
            }

            function setupPromptListener() {
                var promptElement = document.getElementById('prompt');
                if (promptElement) {
                  promptElement.addEventListener('focus', handleFocus);
                } else {
                  console.warn("couldn't find #prompt element")
                }

                return function() {
                  promptElement.removeEventListener('focus', handleFocus);
                }
            }
            // todo remove the listener react loads
            var removePromptListener = setupPromptListener();
          `,
        }}
      />
    </div>
  );
};

export const KeyboardToggle = () => {
  const send = useSend();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        send({ type: "TOGGLE" });
      } else if (e.key === "Escape") {
        e.preventDefault();
        send({ type: "CLOSE" });
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [send]);
  return null;
};

export const VisibleIfTypingPrompt = ({
  children,
}: {
  children: ReactNode;
}) => {
  const actor = useContext(CraftContext);
  const prompt = useSelector(actor, (state) => state.context.prompt);

  return (
    <div className={prompt?.length ? "hidden" : `group-focus-within:hidden`}>
      {children}
    </div>
  );
};
