export const emailKey = (email: string) => ({
  PK: `EMAIL#${email}`,
  SK: `EMAIL#${email}`,
});

export const userProfileKey = (userId: string) => ({
  PK: `USER#${userId}`,
  SK: "PROFILE",
});

export const homeKey = (userId: string, homeId: string) => ({
  PK: `USER#${userId}`,
  SK: `HOME#${homeId}`,
});

export const projectKey = (homeId: string, projectId: string) => ({
  PK: `HOME#${homeId}`,
  SK: `PROJECT#${projectId}`,
});

export const applianceKey = (homeId: string, applianceId: string) => ({
  PK: `HOME#${homeId}`,
  SK: `APPLIANCE#${applianceId}`,
});

export const maintenanceTaskKey = (homeId: string, taskId: string) => ({
  PK: `HOME#${homeId}`,
  SK: `TASK#${taskId}`,
});
