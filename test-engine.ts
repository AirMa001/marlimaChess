import { getTournamentEngine } from './app/actions';

async function main() {
  try {
    const { t } = await getTournamentEngine(1);
    if (!t) {
      console.log('No tournament engine returned');
      return;
    }
    const standings = t.getStandings();
    console.log('Standings:');
    for (const s of standings) {
      console.log(`Player: ${s.player.getName()}, Points: ${s.matchPoints}`);
    }
  } catch (error) {
    console.error(error);
  }
}

main();