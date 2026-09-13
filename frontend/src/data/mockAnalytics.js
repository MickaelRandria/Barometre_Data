// Scénario fictif : les 7 visiteurs trafic sont inclus dans les 9 cliqueurs.
// Une première visite et un premier clic de section par personne, sans revisites.
const mockAnalytics = {
  isMockData: true,
  mockNote: "Données de démonstration — tracking réel à venir après validation du dispositif de diffusion",
  population: 50,
  mailOpened: 30,
  uniqueClicks: 9,
  trafficTeam: { population: 8, engaged: 7 },
  weeklyVisits: [
    { week: 'Semaine 1', visits: 1 },
    { week: 'Semaine 2', visits: 2 },
    { week: 'Semaine 3', visits: 2 },
    { week: 'Semaine 4', visits: 4 },
  ],
  sectionClicks: [
    { section: 'brief', count: 3 },
    { section: 'livre-blanc', count: 4 },
    { section: 'signaux', count: 1 },
    { section: 'overview', count: 1 },
  ],
};

export default mockAnalytics;
