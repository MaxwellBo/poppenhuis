import React, { KeyboardEvent, useEffect, useRef } from 'react';
import {
  Link,
  useSearchParams} from "react-router";

export function QueryPreservingLink(props: { 
  to: string, 
  children: React.ReactNode, 
  triggerKey?: string,
  pushParam?: Map<string, string>,
  popParam?: Set<string> }) {
  const [searchParams] = useSearchParams();
  const linkRef = useRef<HTMLAnchorElement>(null);

  // we want to register a key to trigger the link click on keydown
  useEffect(() => {
    if (!props.triggerKey) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === props.triggerKey) {
        if (linkRef.current) {
          linkRef.current.click();
        }
      }
    };

    // @ts-ignore
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // @ts-ignore
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  const updatedSearchParams = new URLSearchParams(searchParams);

  if (props.pushParam) {
    for (const [key, value] of props.pushParam.entries()) {
      updatedSearchParams.set(key, value);
    }
  }

  if (props.popParam) {
    for (const key of props.popParam) {
      updatedSearchParams.delete(key);
    }
  }

  return <Link ref={linkRef} to={{ pathname: props.to, search: updatedSearchParams.toString() }}>{props.children}</Link>
}