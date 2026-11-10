export const ROLE_PERMISSIONS = {
  STUDENT: [
    'student:read_profile',
    'student:read_attendance',
    'student:read_academics',
    'student:read_assignments',
    'student:read_results',
    'student:read_notifications',
    'student:read_fees',
  ],
  TEACHER: [
    'teacher:read_profile',
    'teacher:read_classes',
    'teacher:read_students',
    'teacher:manage_students',
    'teacher:manage_attendance',
    'teacher:manage_academics',
    'teacher:manage_exams',
    'teacher:manage_assignments',
    'teacher:read_notifications',
  ],
  ADMIN_ACADEMIC: [
    'admin:dashboard',
    'admin:students:view',
    'admin:students:manage',
    'admin:teachers:view',
    'admin:teachers:manage',
    'admin:attendance:manage',
    'admin:academics:manage',
    'admin:exams:manage',
    'admin:results:manage',
  ],
  SUPER_ADMIN: [
    'admin:dashboard',
    'admin:students:view',
    'admin:students:manage',
    'admin:teachers:view',
    'admin:teachers:manage',
    'admin:attendance:manage',
    'admin:academics:manage',
    'admin:exams:manage',
    'admin:results:manage',
    'admin:fees:manage',
    'admin:notifications:manage',
    'admin:events:manage',
    'admin:assignments:manage',
    'admin:gallery:view',
    'admin:gallery:create',
    'admin:gallery:update',
    'admin:gallery:delete',
    'admin:website:manage',
    'admin:users:manage',
    'admin:roles:manage',
    'admin:system:manage',
    'admin:activity-logs:view',
    'admin:admissions:view',
    'admin:admissions:manage',
  ],
};

export const ROLE_NAMES = Object.keys(ROLE_PERMISSIONS);

export const roleOptions = [
  'STUDENT',
  'TEACHER',
  'ADMIN_ACADEMIC',
  'SUPER_ADMIN',
];

export function getRolePermissions(roleName) {
  return ROLE_PERMISSIONS[roleName] ?? [];
}

export function userHasPermission(user, permission) {
  if (!user?.role?.name) return false;
  return (ROLE_PERMISSIONS[user.role.name] ?? []).includes(permission);
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!userHasPermission(req.user, permission)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }

    next();
  };
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role.name)) {
      return res.status(403).json({ message: 'Your role is not allowed to access this area.' });
    }

    next();
  };
}
