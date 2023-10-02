import { ApplicationContext } from "@/context/application";
import { useStore } from "@nanostores/react";
import { useContext, useLayoutEffect, useState } from "react";
import { ActorRefFrom, AnyStateMachine, createActor } from "xstate";

export const useActor = <TMachine extends AnyStateMachine>(
  key: string,
  machine: TMachine
) => {
  const appStore = useContext(ApplicationContext);
  const appState = useStore(appStore, { keys: [key] });
  const existingActor = appState[key] as
    | ActorRefFrom<typeof machine>
    | undefined;

  const [actor] = useState(existingActor || createActor(machine));
  useLayoutEffect(() => {
    if (!existingActor) {
      actor.start();
    }
  }, [actor]);

  return actor;
};