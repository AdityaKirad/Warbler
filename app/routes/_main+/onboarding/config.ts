export type OnboardingStep = {
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
    id: "profile-photo",
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
] as const satisfies readonly OnboardingStep[];

export function getNextOnboardingStep(completedSteps: string[]) {
  return (
    ONBOARDING_STEPS.find((step) => !completedSteps.includes(step.id)) ?? null
  );
}

export function hasStepsAfterCurrent(completedSteps: string[]): boolean {
  const nextStep = getNextOnboardingStep(completedSteps);
  if (!nextStep) return false;

  const afterCompleting = [...completedSteps, nextStep.id];
  return getNextOnboardingStep(afterCompleting) !== null;
}
