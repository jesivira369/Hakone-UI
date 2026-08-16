/** @type {import('next').NextConfig} */

// El proxy BFF vive en app/api/v1/[...path]/route.ts, NO acá.
// Antes había además un rewrite a /api/v1/:path* que nunca llegaba a ejecutarse:
// los rewrites devueltos como array corren en la fase "afterFiles", o sea después
// de las rutas del filesystem, así que el route handler siempre ganaba. Mantener
// las dos definiciones solo servía para que divergieran (apuntaban a puertos
// distintos) y para hacer creer que tocar esta config cambiaba algo.
const nextConfig = {};

module.exports = nextConfig;

