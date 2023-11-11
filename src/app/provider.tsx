"use client";

import { ApplicationContext } from "@/context/application";
import { useActor } from "@/hooks/useActor";
import { map } from "nanostores";
import { Profiler, ReactNode, useEffect, useState } from "react";
import { HeaderContext, createHeaderMachine } from "./header";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useSend } from "@/hooks/useSend";

// export const ApplicationContext = createContext()

// const ApplicationInputSchema = z.object({
//   userId: z.string().optional(),
//   sessionId: z.string(),
// });
// type ApplicationInput = z.infer<typeof ApplicationInputSchema>;

export function ApplicationProvider(props: { children: ReactNode }) {
  // const craftSegments = useSelectedLayoutSegment("craft");
  // console.log({ craftSegments });
  const [store] = useState(map<any>({})); // todo define global types here

  return (
    <ApplicationContext.Provider value={store}>
      <PageLoadProvider />
      <HeaderProvider>{props.children}</HeaderProvider>
    </ApplicationContext.Provider>
  );
}

const PageLoadProvider = () => {
  const pathname = usePathname();
  const send = useSend();

  useEffect(() => {
    send({ type: "PAGE_LOADED", pathname });
  }, [send, pathname]);

  return null;
};

const HeaderProvider = (props: { children: ReactNode }) => {
  const headerActor = useActor("header", createHeaderMachine());
  return (
    <HeaderContext.Provider value={headerActor}>
      {props.children}
    </HeaderContext.Provider>
  );
};

// export const ClientCookiesProvider: typeof CookiesProvider = (props) => (
//   <CookiesProvider {...props} />
// );
