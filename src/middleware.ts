import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico)).*)']
};
