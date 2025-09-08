// // navigation.ts 或 lib/navigation.ts
// import { createNavigation } from 'next-intl/navigation';
// import { routing } from './routing';

// export const { Link, redirect, usePathname, useRouter } = 
//   createNavigation(routing);

import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);
