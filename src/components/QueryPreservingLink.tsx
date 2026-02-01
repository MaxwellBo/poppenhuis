import React, { KeyboardEvent, useEffect, useRef } from 'react';
import {
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


  // Preserve all query params except 'page' (pagination is route-specific, not carried across links)
  const preserved = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'page') preserved.set(key, value);
  });
  props.popParam?.forEach((key) => preserved.delete(key));
  props.pushParam?.forEach((value, key) => preserved.set(key, value));

  return <>
    <NavLink 
      ref={linkRef} 
      id={props.id}
        className={({ isActive, isPending }) => {
          return isPending 
            ? `${props.className} pending` 
            : isActive 
              ? `${props.className} active` 
              : props.className
        }
      }
      to={{ pathname: props.to, search: preserved.toString() }}>
        {props.children}
      </NavLink>
      {props.triggerKey && <kbd className='block' onClick={() => linkRef.current?.click()}>{props.triggerKey}</kbd>}
  </>
}