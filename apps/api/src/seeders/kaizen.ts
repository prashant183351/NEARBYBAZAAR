import { Kaizen } from '../models/Kaizen';
import { Decision } from '../models/Decision';

export async function seedKaizenExamples() {
    if (process.env.SEED_KAIZEN_EXAMPLES !== 'true') {
        console.log('Skipping Kaizen example seeding.');
        return;
    }
    // Example ideas
    const ideas = [
        { title: 'Add dark mode', tags: ['UI', 'theme'], owners: [], description: 'Support dark mode for all users.' },
        { title: 'Improve onboarding', tags: ['UX'], owners: [], description: 'Make onboarding easier for new vendors.' },
    ];
    for (const idea of ideas) {
        await Kaizen.updateOne({ title: idea.title }, idea, { upsert: true });
    }
    // Example decisions
    const decisions = [
        { title: 'Dark mode released', description: 'Dark mode is now available.', madeBy: 'admin', madeAt: new Date(), immutable: true },
        { title: 'Onboarding improvements scheduled', description: 'Onboarding flow will be improved next sprint.', madeBy: 'admin', madeAt: new Date(), immutable: true },
    ];
    for (const dec of decisions) {
        await Decision.updateOne({ title: dec.title }, dec, { upsert: true });
    }
}

if (require.main === module) {
    seedKaizenExamples().then(() => {
        console.log('Seeded Kaizen example ideas and decisions.');
        process.exit(0);
    });
}
