// Stub for emailQueue
export const emailQueue = {
  add: async (jobName: string, data: any) => {
    // Simulate queueing an email job
    return Promise.resolve({ jobName, data });
  },
};
