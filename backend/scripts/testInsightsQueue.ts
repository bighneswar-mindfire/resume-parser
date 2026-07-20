import { requestInsightsRefresh, insightsQueue } from '../src/queues/queueSetup.js';

async function main() {
  await requestInsightsRefresh('manual-test');
  await requestInsightsRefresh('manual-test-dup1');
  await requestInsightsRefresh('manual-test-dup2');

  const counts = await insightsQueue.getJobCounts('delayed', 'waiting', 'completed');
  console.log('queue counts after 3 requests:', JSON.stringify(counts));

  await new Promise((resolve) => setTimeout(resolve, 6000));

  const after = await insightsQueue.getJobCounts('delayed', 'waiting', 'completed');
  console.log('after debounce window:', JSON.stringify(after));

  await insightsQueue.close();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
