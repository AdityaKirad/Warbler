type OnboardingStep = {
  id: string;
  required: boolean;
  title: string;
  description: string;
};

export const ONBOARDING_STEPS = [
  {
    id: "verify-email",
    required: true,
    title: "Verify your email",
    description: "We'll send you a verification code",
  },
  {
    id: "dob",
    required: true,
    title: "Enter your date of birth",
    description:
      "This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or something else.",
  },
  {
    id: "profile_photo",
    required: false,
    title: "Pick a profile picture",
    description: "Have a favorite selfie? Upload it now.",
  },
  {
    id: "username",
    required: false,
    title: "Choose your username",
    description: "Pick a unique username for your profile",
  },
] as const satisfies OnboardingStep[];

export function hasCompletedRequiredOnboarding(completedSteps: string[]) {
  const requiredSteps = ONBOARDING_STEPS.filter((step) => step.required).map(
    (step) => step.id,
  );

  return requiredSteps.every((stepId) => completedSteps.includes(stepId));
}

export function hasCompletedStep(completedSteps: string[], stepId: string) {
  return completedSteps.includes(stepId);
}

export function getNextOnboardingStep(completedSteps: string[]) {
  return (
    ONBOARDING_STEPS.find((step) => !completedSteps.includes(step.id)) || null
  );
}
