import { useState } from 'react';
import { updateProfile, getProfile } from '../lib/database';

interface UsernameModalProps {
    userId: string;
    onComplete: () => void;
}

export function UsernameModal({ userId, onComplete }: UsernameModalProps) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }
        setLoading(true);
        try {
            // Create profile
            await updateProfile(userId, {
                username: username,
                full_name: username, // default
                created_at: new Date().toISOString()
            });
            onComplete();
        } catch (e: any) {
            // Simplify duplicate check logic
            if (e.message?.includes('unique constraint')) {
                setError('Username already taken');
            } else {
                setError('Error saving username');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border w-full max-w-sm p-6 rounded-2xl shadow-2xl">
                <h2 className="text-2xl font-bold text-foreground mb-2">Welcome! 👋</h2>
                <p className="text-muted-foreground mb-6">Choose a username to get started.</p>

                <div className="space-y-4">
                    <div>
                        <input
                            value={username}
                            onChange={e => {
                                setUsername(e.target.value);
                                setError('');
                            }}
                            placeholder="@username"
                            className="w-full bg-secondary text-foreground p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !username}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Setting up...' : 'Get Started'}
                    </button>
                </div>
            </div>
        </div>
    );
}
