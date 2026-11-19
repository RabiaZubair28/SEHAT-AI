import { PermissionPayload } from "@/data/types";

export function hasPermission(
  permissions: PermissionPayload[] | undefined,
  route: string,
  method: string
): boolean {
  if (!permissions) return false;

  return permissions.some((perm) => {
    return (
      matchRoute(route, perm.route) &&
      perm.method.toUpperCase() === method.toUpperCase()
    );
  });
}

// Handles dynamic routes like /patients/:id
function matchRoute(actual: string, pattern: string): boolean {
  if (!actual || !pattern) return false;
  const normalize = (path: string) =>
    path.replace(/:\w+/g, "[^/]+")?.replace(/\//g, "\\/");
  const regex = new RegExp(`^${normalize(pattern)}$`);
  return regex.test(actual);
}
