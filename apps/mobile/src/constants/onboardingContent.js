/**
 * Contenu des 4 slides onboarding Ollync (collabs créateurs).
 * Dégradés marqués, style Preply / vivant.
 */
export const ONBOARDING_SLIDES = [
  {
    id: "1",
    title: "Trouve des créateurs, vite.",
    description:
      "Publie une demande ou une offre, et connecte-toi aux bons profils.",
    gradient: ["#FF6B9D", "#FF8E53", "#FF6B35"],
    lottieSource: require("../assets/lottie/slide1.json"),
  },
  {
    id: "2",
    title: "Services, missions, événements.",
    description:
      "Un seul endroit pour gérer tout ce qui fait avancer ton contenu.",
    gradient: ["#2563EB", "#7C3AED", "#A855F7"],
    lottieSource: require("../assets/lottie/slide2.json"),
  },
  {
    id: "3",
    title: "Messagerie claire.",
    description:
      "Discute, envoie des détails, et avance sans perdre de temps.",
    gradient: ["#8B5CF6", "#EC4899", "#F43F5E"],
    lottieSource: require("../assets/lottie/slide3.json"),
  },
  {
    id: "4",
    title: "Paiements & confiance (bientôt).",
    description:
      "Commission, profils vérifiés, boost d'annonces: tout sera clean.",
    gradient: ["#059669", "#06B6D4", "#0EA5E9"],
    lottieSource: require("../assets/lottie/slide4.json"),
  },
];

/** À incrémenter à chaque mise à jour des slides : tous les profils revoient l'onboarding. */
export const ONBOARDING_CONTENT_VERSION = "1";

export const ONBOARDING_STORAGE_KEY = "onboardingSeenVersion";
