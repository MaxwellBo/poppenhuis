import React, { KeyboardEvent, useEffect, useRef } from 'react';
import {
  NavLink,
  useNavigate,
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
  const navigate = useNavigate();
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

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Check if View Transition API is supported
    if ('startViewTransition' in document) {
      e.preventDefault();
      const targetUrl = `${props.to}?${searchParams.toString()}`;
      
      // @ts-ignore - startViewTransition is not in TypeScript types yet
      document.startViewTransition(() => {
        navigate(targetUrl);
      });
    }
    // Otherwise let the default navigation happen
  };

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
      to={{ pathname: props.to, search: searchParams.toString() }}
      onClick={handleClick}>
        {props.children}
      </NavLink>
      {props.triggerKey && <kbd className='block' onClick={() => linkRef.current?.click()}>{props.triggerKey}</kbd>}
  </>
}