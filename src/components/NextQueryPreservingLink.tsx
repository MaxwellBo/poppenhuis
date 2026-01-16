import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export function QueryPreservingLink(props: { 
  to: string, 
  id?: string,
  className?: string,
  children: React.ReactNode, 
  triggerKey?: string,
  pushParam?: Map<string, string>,
  popParam?: Set<string> 
}) {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);

  // Preserve query params
  const searchParams = new URLSearchParams();
  if (router.query) {
    Object.entries(router.query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else if (value) {
        searchParams.append(key, value);
      }
    });
  }

  // Add or remove params based on props
  if (props.pushParam) {
    props.pushParam.forEach((value, key) => {
      searchParams.set(key, value);
    });
  }
  if (props.popParam) {
    props.popParam.forEach(key => {
      searchParams.delete(key);
    });
  }

  const queryString = searchParams.toString();
  const href = queryString ? `${props.to}?${queryString}` : props.to;

  // Register a key to trigger the link click on keydown
  useEffect(() => {
    if (!props.triggerKey) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === props.triggerKey) {
        if (linkRef.current) {
          linkRef.current.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [props.triggerKey]);

  // Determine if link is active
  const isActive = router.pathname === props.to || router.asPath.startsWith(props.to + '/');
  const className = isActive ? `${props.className} active` : props.className;

  return (
    <>
      <Link 
        ref={linkRef} 
        id={props.id}
        className={className}
        href={href}
      >
        {props.children}
      </Link>
      {props.triggerKey && <kbd className='block' onClick={() => linkRef.current?.click()}>{props.triggerKey}</kbd>}
    </>
  );
}
