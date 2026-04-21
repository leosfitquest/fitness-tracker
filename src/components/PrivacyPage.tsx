export function PrivacyPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-4 font-sans max-w-4xl mx-auto py-8">
        <button onClick={onBack} className="text-emerald-500 font-medium mb-6 hover:underline flex items-center gap-2">
            ← Back
        </button>
      <h1 className="text-3xl font-black text-white mb-6 tracking-tight">Privacy Policy</h1>
      
      <div className="space-y-6 text-sm">
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-emerald-400 mb-3">1. Information We Collect</h2>
          <p className="mb-2">We collect the following personal information when you use FitQuest:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>Account details (email, username, avatar)</li>
            <li>Profile statistics (bodyweight, height, age, training experience)</li>
            <li>Workout data (exercises performed, sets, reps, weight)</li>
            <li>Step tracking data (if enabled)</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-emerald-400 mb-3">2. How We Use Information</h2>
          <p className="mb-2">Your information is used strictly to provide and improve the FitQuest experience:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>To rank you against global and age-bracket standards.</li>
            <li>To personalize workout recommendations and cycle rotations.</li>
            <li>To manage your social feed, allowing friends to see your progress.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-emerald-400 mb-3">3. Data Sharing and Security</h2>
          <p className="text-slate-400">
            We do not sell your personal data to third parties. Your workout logs and profile information are stored securely via Supabase. You have full control over your social visibility and can choose to keep your workouts private.
          </p>
        </section>

        <section className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-emerald-400 mb-3">4. Device Data</h2>
          <p className="text-slate-400">
            Features like the Step Counter require access to your device's accelerometer. This motion data is processed locally to estimate step counts. Only the final aggregated daily steps are saved to our servers to calculate your Rank progression.
          </p>
        </section>
        
        <p className="text-slate-500 text-xs text-center mt-8 pt-4 border-t border-slate-800">
            Last Updated: April 2026. If you have questions, please contact our support team.
        </p>
      </div>
    </div>
  );
}
