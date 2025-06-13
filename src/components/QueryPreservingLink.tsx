import React, { KeyboardEvent, useEffect, useRef } from 'react';
import {
  Link,
  useSearchParams} from "react-router";

export function QueryPreservingLink(props: { to: string, children: React.ReactNode, triggerKey?: string }) {
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

  return <Link ref={linkRef} to={{ pathname: props.to, search: searchParams.toString() }}>{props.children}</Link>
}