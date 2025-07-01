import React, { KeyboardEvent, useEffect, useRef } from 'react';
import {
  Link,
  NavLink,
  useSearchParams} from "react-router";

export function QueryPreservingLink(props: { 
  to: string, 
  id?: string,
  className?: string,
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


  return <NavLink 
    ref={linkRef} 
    id={props.id}
      className={({ isActive, isPending }) =>
        isPending 
          ? `${props.className} pending` 
          : isActive 
            ? `${props.className} active` 
            : props.className
    }
    to={{ pathname: props.to, search: searchParams.toString() }}>
      {props.children}
    </NavLink>
}