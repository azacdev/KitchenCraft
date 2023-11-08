import { ApplicationContext } from "@/context/application";
import { useStore } from "@nanostores/react";
import { useContext, useLayoutEffect, useState } from "react";
import {
  ActorOptions,
  ActorRefFrom,
  AnyStateMachine,
  createActor,
} from "xstate";
import { useEvents } from "./useEvents";

export const useActor = <TMachine extends AnyStateMachine>(
  key: string,
  machine: TMachine,
  opts?: ActorOptions<TMachine>
) => {
  const appStore = useContext(ApplicationContext);
  const event$ = useEvents();
  const appState = useStore(appStore, { keys: [key] });
  const existingActor = appState[key] as
    | ActorRefFrom<typeof machine>
    | undefined;

  const [actor] = useState(existingActor || createActor(machine, opts));
  useLayoutEffect(() => {
    if (actor !== appStore.get()[key]) {
      appStore.setKey(key, actor);
      actor.start();
      event$.subscribe((event) => {
        actor.send(event as any);
      });
    }
  }, [key, actor, event$, appStore]);

  return actor;
};
