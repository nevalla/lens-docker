import type { Injectable2 } from "@k8slens/injectable";
import type { Subscribable } from "@k8slens/subscribable";
import { useSubscribable } from "@k8slens/subscribable-react";
import { useInject } from "@k8slens/use-inject";
import { use } from "react";

// The current value of polled docker data. Suspends until it is there: render inside Suspense, in an
// observer, so that later values re-render it.
export const useLoaded = <T, TKeys extends unknown[]>(
  subscribable: Injectable2<(...keys: TKeys) => Subscribable<T>>,
  ...keys: TKeys
): T => use(useSubscribable(useInject(subscribable)(...keys)).value).get();
