interface AuthLinkLocation {
  pathname: string;
  search: string;
  hash: string;
}

/** Route auth callbacks before normal login/install/session redirects discard them. */
export function getAuthLinkDestination(location: AuthLinkLocation): AuthLinkLocation | null {
  if (location.pathname === '/invite' || location.pathname === '/auth/callback') return null;

  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ''));
  const type = fragment.get('type') ?? query.get('type');
  const isPasswordLink = type === 'invite' || type === 'recovery';
  const hasVerification = query.has('code') || query.has('token_hash');
  const hasSession = fragment.has('access_token') && fragment.has('refresh_token');
  const hasError = [query, fragment].some(params =>
    params.has('error') || params.has('error_description') || params.has('error_code'),
  );

  if (!isPasswordLink && !hasVerification && !hasSession && !hasError) return null;

  // Keep the callback payload intact. InviteAcceptPage verifies it and clears it.
  return { pathname: '/invite', search: location.search, hash: location.hash };
}
