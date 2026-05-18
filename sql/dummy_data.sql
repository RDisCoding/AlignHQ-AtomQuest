-- Dummy data for AtomQuest / AlignHQ
-- Run in pgAdmin against the same database used by the app.
-- Assumes Prisma's implicit join table for EmployeeProfile <-> SharedGoal is "_EmployeeProfileToSharedGoal".

-- 1) Core users
INSERT INTO "User" (email, name, password, role)
VALUES
  ('admin@test.com', 'System Admin', 'pass123', 'ADMIN'),
  ('manager@test.com', 'Jane Manager', 'pass123', 'MANAGER'),
  ('employee@test.com', 'John Employee', 'pass123', 'EMPLOYEE'),
  ('employee2@test.com', 'Alice Smith', 'pass123', 'EMPLOYEE'),
  ('employee3@test.com', 'Bob Johnson', 'pass123', 'EMPLOYEE')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  updatedAt = NOW();

-- 2) Employee profiles
WITH manager_user AS (
  SELECT id FROM "User" WHERE email = 'manager@test.com' LIMIT 1
), manager_profile AS (
  INSERT INTO "EmployeeProfile" ("userId", department)
  SELECT manager_user.id, 'Engineering'
  FROM manager_user
  ON CONFLICT ("userId") DO UPDATE SET
    department = EXCLUDED.department
  RETURNING id
)
INSERT INTO "EmployeeProfile" ("userId", department, "managerId")
SELECT u.id, 'Engineering', (SELECT id FROM manager_profile LIMIT 1)
FROM "User" u
WHERE u.email IN ('employee@test.com', 'employee2@test.com', 'employee3@test.com')
ON CONFLICT ("userId") DO UPDATE SET
  department = EXCLUDED.department,
  "managerId" = EXCLUDED."managerId";

-- 3) Shared goals
INSERT INTO "SharedGoal" (title, description, "thrustArea", "uomType", target, "primaryOwnerId")
SELECT 'Reduce Customer Response Time',
       'Department KPI focused on improving first-response and resolution speed.',
       'Customer Success',
       'PERCENTAGE_MIN',
       80,
       ep.id
FROM "EmployeeProfile" ep
JOIN "User" u ON u.id = ep."userId"
WHERE u.email = 'employee@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM "SharedGoal" sg WHERE sg.title = 'Reduce Customer Response Time'
  );

INSERT INTO "SharedGoal" (title, description, "thrustArea", "uomType", target, "primaryOwnerId")
SELECT 'Improve First Contact Resolution',
       'Department KPI for reducing repeat tickets and improving issue closure quality.',
       'Support Operations',
       'PERCENTAGE_MAX',
       92,
       ep.id
FROM "EmployeeProfile" ep
JOIN "User" u ON u.id = ep."userId"
WHERE u.email = 'employee2@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM "SharedGoal" sg WHERE sg.title = 'Improve First Contact Resolution'
  );

-- 4) Shared goal assignments
WITH sg AS (
  SELECT id, title FROM "SharedGoal" WHERE title = 'Reduce Customer Response Time' LIMIT 1
), employees AS (
  SELECT ep.id
  FROM "EmployeeProfile" ep
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email IN ('employee@test.com', 'employee2@test.com', 'employee3@test.com')
)
INSERT INTO "_EmployeeProfileToSharedGoal" ("A", "B")
SELECT employees.id, sg.id
FROM employees
CROSS JOIN sg
WHERE NOT EXISTS (
  SELECT 1
  FROM "_EmployeeProfileToSharedGoal" link
  WHERE link."A" = employees.id AND link."B" = sg.id
);

WITH sg AS (
  SELECT id, title FROM "SharedGoal" WHERE title = 'Improve First Contact Resolution' LIMIT 1
), employees AS (
  SELECT ep.id
  FROM "EmployeeProfile" ep
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email IN ('employee2@test.com', 'employee3@test.com')
)
INSERT INTO "_EmployeeProfileToSharedGoal" ("A", "B")
SELECT employees.id, sg.id
FROM employees
CROSS JOIN sg
WHERE NOT EXISTS (
  SELECT 1
  FROM "_EmployeeProfileToSharedGoal" link
  WHERE link."A" = employees.id AND link."B" = sg.id
);

-- 5) Goal sheets for Q1 2024
INSERT INTO "GoalSheet" ("employeeId", period, status)
SELECT ep.id, '2024-Q1', 'LOCKED'
FROM "EmployeeProfile" ep
JOIN "User" u ON u.id = ep."userId"
WHERE u.email = 'employee@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM "GoalSheet" gs WHERE gs."employeeId" = ep.id AND gs.period = '2024-Q1'
  );

INSERT INTO "GoalSheet" ("employeeId", period, status)
SELECT ep.id, '2024-Q1', 'SUBMITTED'
FROM "EmployeeProfile" ep
JOIN "User" u ON u.id = ep."userId"
WHERE u.email = 'employee2@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM "GoalSheet" gs WHERE gs."employeeId" = ep.id AND gs.period = '2024-Q1'
  );

INSERT INTO "GoalSheet" ("employeeId", period, status)
SELECT ep.id, '2024-Q1', 'DRAFT'
FROM "EmployeeProfile" ep
JOIN "User" u ON u.id = ep."userId"
WHERE u.email = 'employee3@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM "GoalSheet" gs WHERE gs."employeeId" = ep.id AND gs.period = '2024-Q1'
  );

-- 6) Employee 1 sheet goals
WITH sheet AS (
  SELECT gs.id
  FROM "GoalSheet" gs
  JOIN "EmployeeProfile" ep ON ep.id = gs."employeeId"
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email = 'employee@test.com' AND gs.period = '2024-Q1'
  LIMIT 1
), shared_goal AS (
  SELECT id, title, description, "thrustArea", "uomType", target
  FROM "SharedGoal"
  WHERE title = 'Reduce Customer Response Time'
  LIMIT 1
)
INSERT INTO "Goal" ("goalSheetId", title, description, "thrustArea", "uomType", target, weightage, "sharedGoalId")
SELECT sheet.id,
       shared_goal.title,
       shared_goal.description,
       shared_goal."thrustArea",
       shared_goal."uomType",
       shared_goal.target,
       40,
       shared_goal.id
FROM sheet, shared_goal
WHERE NOT EXISTS (
  SELECT 1 FROM "Goal" g WHERE g."goalSheetId" = sheet.id AND g."sharedGoalId" = shared_goal.id
);

WITH sheet AS (
  SELECT gs.id
  FROM "GoalSheet" gs
  JOIN "EmployeeProfile" ep ON ep.id = gs."employeeId"
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email = 'employee@test.com' AND gs.period = '2024-Q1'
  LIMIT 1
)
INSERT INTO "Goal" ("goalSheetId", title, description, "thrustArea", "uomType", target, weightage)
SELECT sheet.id,
       'Personal Upsell Opportunities',
       'Increase conversion of existing accounts through targeted upsell conversations.',
       'Revenue Growth',
       'NUMERIC_MAX',
       25,
       60
FROM sheet
WHERE NOT EXISTS (
  SELECT 1 FROM "Goal" g WHERE g."goalSheetId" = sheet.id AND g.title = 'Personal Upsell Opportunities'
);

-- 7) Employee 2 sheet goals
WITH sheet AS (
  SELECT gs.id
  FROM "GoalSheet" gs
  JOIN "EmployeeProfile" ep ON ep.id = gs."employeeId"
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email = 'employee2@test.com' AND gs.period = '2024-Q1'
  LIMIT 1
), shared_goal AS (
  SELECT id, title, description, "thrustArea", "uomType", target
  FROM "SharedGoal"
  WHERE title = 'Reduce Customer Response Time'
  LIMIT 1
)
INSERT INTO "Goal" ("goalSheetId", title, description, "thrustArea", "uomType", target, weightage, "sharedGoalId")
SELECT sheet.id,
       shared_goal.title,
       shared_goal.description,
       shared_goal."thrustArea",
       shared_goal."uomType",
       shared_goal.target,
       35,
       shared_goal.id
FROM sheet, shared_goal
WHERE NOT EXISTS (
  SELECT 1 FROM "Goal" g WHERE g."goalSheetId" = sheet.id AND g."sharedGoalId" = shared_goal.id
);

WITH sheet AS (
  SELECT gs.id
  FROM "GoalSheet" gs
  JOIN "EmployeeProfile" ep ON ep.id = gs."employeeId"
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email = 'employee2@test.com' AND gs.period = '2024-Q1'
  LIMIT 1
), shared_goal AS (
  SELECT id, title, description, "thrustArea", "uomType", target
  FROM "SharedGoal"
  WHERE title = 'Improve First Contact Resolution'
  LIMIT 1
)
INSERT INTO "Goal" ("goalSheetId", title, description, "thrustArea", "uomType", target, weightage, "sharedGoalId")
SELECT sheet.id,
       shared_goal.title,
       shared_goal.description,
       shared_goal."thrustArea",
       shared_goal."uomType",
       shared_goal.target,
       25,
       shared_goal.id
FROM sheet, shared_goal
WHERE NOT EXISTS (
  SELECT 1 FROM "Goal" g WHERE g."goalSheetId" = sheet.id AND g."sharedGoalId" = shared_goal.id
);

WITH sheet AS (
  SELECT gs.id
  FROM "GoalSheet" gs
  JOIN "EmployeeProfile" ep ON ep.id = gs."employeeId"
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email = 'employee2@test.com' AND gs.period = '2024-Q1'
  LIMIT 1
)
INSERT INTO "Goal" ("goalSheetId", title, description, "thrustArea", "uomType", target, weightage)
SELECT sheet.id,
       'Backlog Cleanup',
       'Reduce support backlog by consistently closing old tickets.',
       'Operations',
       'NUMERIC_MIN',
       50,
       40
FROM sheet
WHERE NOT EXISTS (
  SELECT 1 FROM "Goal" g WHERE g."goalSheetId" = sheet.id AND g.title = 'Backlog Cleanup'
);

-- 8) Employee 3 sheet goals
WITH sheet AS (
  SELECT gs.id
  FROM "GoalSheet" gs
  JOIN "EmployeeProfile" ep ON ep.id = gs."employeeId"
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email = 'employee3@test.com' AND gs.period = '2024-Q1'
  LIMIT 1
), shared_goal AS (
  SELECT id, title, description, "thrustArea", "uomType", target
  FROM "SharedGoal"
  WHERE title = 'Reduce Customer Response Time'
  LIMIT 1
)
INSERT INTO "Goal" ("goalSheetId", title, description, "thrustArea", "uomType", target, weightage, "sharedGoalId")
SELECT sheet.id,
       shared_goal.title,
       shared_goal.description,
       shared_goal."thrustArea",
       shared_goal."uomType",
       shared_goal.target,
       30,
       shared_goal.id
FROM sheet, shared_goal
WHERE NOT EXISTS (
  SELECT 1 FROM "Goal" g WHERE g."goalSheetId" = sheet.id AND g."sharedGoalId" = shared_goal.id
);

WITH sheet AS (
  SELECT gs.id
  FROM "GoalSheet" gs
  JOIN "EmployeeProfile" ep ON ep.id = gs."employeeId"
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email = 'employee3@test.com' AND gs.period = '2024-Q1'
  LIMIT 1
), shared_goal AS (
  SELECT id, title, description, "thrustArea", "uomType", target
  FROM "SharedGoal"
  WHERE title = 'Improve First Contact Resolution'
  LIMIT 1
)
INSERT INTO "Goal" ("goalSheetId", title, description, "thrustArea", "uomType", target, weightage, "sharedGoalId")
SELECT sheet.id,
       shared_goal.title,
       shared_goal.description,
       shared_goal."thrustArea",
       shared_goal."uomType",
       shared_goal.target,
       30,
       shared_goal.id
FROM sheet, shared_goal
WHERE NOT EXISTS (
  SELECT 1 FROM "Goal" g WHERE g."goalSheetId" = sheet.id AND g."sharedGoalId" = shared_goal.id
);

WITH sheet AS (
  SELECT gs.id
  FROM "GoalSheet" gs
  JOIN "EmployeeProfile" ep ON ep.id = gs."employeeId"
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email = 'employee3@test.com' AND gs.period = '2024-Q1'
  LIMIT 1
)
INSERT INTO "Goal" ("goalSheetId", title, description, "thrustArea", "uomType", target, weightage)
SELECT sheet.id,
       'Knowledge Base Contributions',
       'Document recurring support answers and improve team self-service.',
       'Enablement',
       'NUMERIC_MAX',
       12,
       40
FROM sheet
WHERE NOT EXISTS (
  SELECT 1 FROM "Goal" g WHERE g."goalSheetId" = sheet.id AND g.title = 'Knowledge Base Contributions'
);

-- 9) Check-ins for the locked sheet
WITH sheet AS (
  SELECT gs.id
  FROM "GoalSheet" gs
  JOIN "EmployeeProfile" ep ON ep.id = gs."employeeId"
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email = 'employee@test.com' AND gs.period = '2024-Q1'
  LIMIT 1
)
INSERT INTO "CheckIn" ("goalId", quarter, "actualAchievement", status, "managerComment")
SELECT g.id, 'Q1', 80, 'ON_TRACK', 'Strong progress on the shared KPI.'
FROM "Goal" g
JOIN sheet ON sheet.id = g."goalSheetId"
WHERE g."sharedGoalId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "CheckIn" ci WHERE ci."goalId" = g.id AND ci.quarter = 'Q1'
  );

WITH sheet AS (
  SELECT gs.id
  FROM "GoalSheet" gs
  JOIN "EmployeeProfile" ep ON ep.id = gs."employeeId"
  JOIN "User" u ON u.id = ep."userId"
  WHERE u.email = 'employee@test.com' AND gs.period = '2024-Q1'
  LIMIT 1
)
INSERT INTO "CheckIn" ("goalId", quarter, "actualAchievement", status, "managerComment")
SELECT g.id, 'Q1', 22, 'COMPLETED', 'Personal goal completed above target.'
FROM "Goal" g
JOIN sheet ON sheet.id = g."goalSheetId"
WHERE g.title = 'Personal Upsell Opportunities'
  AND NOT EXISTS (
    SELECT 1 FROM "CheckIn" ci WHERE ci."goalId" = g.id AND ci.quarter = 'Q1'
  );

-- 10) Audit log samples
INSERT INTO "AuditLog" ("userId", action, "goalId", "previousValue", "newValue")
SELECT u.id, 'SHARED_GOAL_CREATED', NULL, NULL, 'Created Department KPIs for Q1'
FROM "User" u
WHERE u.email = 'manager@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM "AuditLog" al WHERE al."userId" = u.id AND al.action = 'SHARED_GOAL_CREATED'
  );

INSERT INTO "AuditLog" ("userId", action, "goalId", "previousValue", "newValue")
SELECT u.id, 'GOAL_SHEET_APPROVED', NULL, 'SUBMITTED', 'LOCKED'
FROM "User" u
JOIN "EmployeeProfile" ep ON ep."userId" = u.id
JOIN "GoalSheet" gs ON gs."employeeId" = ep.id
WHERE u.email = 'manager@test.com'
  AND EXISTS (SELECT 1 FROM "GoalSheet" g2 WHERE g2.id = gs.id AND g2.status = 'LOCKED')
  AND NOT EXISTS (
    SELECT 1 FROM "AuditLog" al WHERE al."goalId" = gs.id AND al.action = 'GOAL_SHEET_APPROVED'
  );

INSERT INTO "AuditLog" ("userId", action, "goalId", "previousValue", "newValue")
SELECT u.id, 'GOAL_SHEET_UNLOCKED', NULL, 'LOCKED', 'SUBMITTED'
FROM "User" u
JOIN "EmployeeProfile" ep ON ep."userId" = u.id
JOIN "GoalSheet" gs ON gs."employeeId" = ep.id
WHERE u.email = 'admin@test.com'
  AND EXISTS (SELECT 1 FROM "GoalSheet" g2 WHERE g2.id = gs.id AND g2.status = 'LOCKED')
  AND NOT EXISTS (
    SELECT 1 FROM "AuditLog" al WHERE al."goalId" = gs.id AND al.action = 'GOAL_SHEET_UNLOCKED'
  );
