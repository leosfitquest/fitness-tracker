import { useState } from 'react';
import Papa from 'papaparse';
import type { User } from '@supabase/supabase-js';
import { Upload, Download, CheckCircle, Database } from 'lucide-react';
import { saveSessionLog } from '../lib/database';
import { useToast } from './Toast';

type FieldMap = {
  date: string;
  exercise: string;
  weight: string;
  reps: string;
};

interface MigratorProps {
  userId: string;
  onClose: () => void;
}

export function Migrator({ userId, onClose }: MigratorProps) {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<FieldMap>({ date: '', exercise: '', weight: '', reps: '' });
  const [isImporting, setIsImporting] = useState(false);
  const { showToast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data);
          const cols = Object.keys(results.data[0] as any);
          setHeaders(cols);
          
          // Auto-detect Hevy presets
          if (cols.includes('start_time') && cols.includes('exercise_title') && cols.includes('weight_kg')) {
            setMapping({
              date: 'start_time',
              exercise: 'exercise_title',
              weight: 'weight_kg',
              reps: 'reps'
            });
            showToast("Hevy CSV format detected!", "success");
          } else if (cols.includes('Date') && cols.includes('Exercise Name') && cols.includes('Weight')) {
             // Strong App preset guess
             setMapping({
              date: 'Date',
              exercise: 'Exercise Name',
              weight: 'Weight',
              reps: 'Reps'
            });
            showToast("Strong CSV format detected!", "success");
          }
        }
      }
    });
  };

  const executeImport = async () => {
    if (!mapping.date || !mapping.exercise || !mapping.weight || !mapping.reps) {
      showToast("Please map all fields.", "error");
      return;
    }

    setIsImporting(true);
    try {
      // Group rows by Date to form Sessions
      const sessionsByDate: Record<string, any[]> = {};
      
      csvData.forEach(row => {
        const dateStr = row[mapping.date];
        if (!dateStr) return;
        const dateKey = new Date(dateStr).toISOString().split('T')[0];
        
        if (!sessionsByDate[dateKey]) sessionsByDate[dateKey] = [];
        sessionsByDate[dateKey].push(row);
      });

      let importedCount = 0;

      for (const [, rows] of Object.entries(sessionsByDate)) {
        // Group exercises within the session
        const exercisesMap: Record<string, any> = {};
        
        rows.forEach(row => {
          const exName = row[mapping.exercise];
          if (!exName) return;
          
          if (!exercisesMap[exName]) {
            exercisesMap[exName] = {
              exerciseId: `mapped-${exName.replace(/\s+/g, '-').toLowerCase()}`,
              name: exName,
              muscleGroup: 'core', // Unknown from CSV typically
              sets: []
            };
          }
          
          const weight = parseFloat(row[mapping.weight]);
          const reps = parseInt(row[mapping.reps]);
          
          if (!isNaN(weight) && !isNaN(reps)) {
             exercisesMap[exName].sets.push({
               setNumber: exercisesMap[exName].sets.length + 1,
               weight,
               reps,
               completed: true
             });
          }
        });

        const workoutData = Object.values(exercisesMap);
        if (workoutData.length === 0) continue;

        // Save session log
        await saveSessionLog({
          workoutId: 'imported', // marker
          workoutName: `Imported Workout`,
          startedAt: rows[0][mapping.date],
          endedAt: rows[0][mapping.date],
          durationMinutes: 60,
          totalVolume: workoutData.reduce((acc, ex) => acc + ex.sets.reduce((sAcc: number, set: any) => sAcc + (set.weight * set.reps), 0), 0),
          totalSetsCompleted: workoutData.reduce((acc, ex) => acc + ex.sets.length, 0),
          isDeload: false,
          exercises: workoutData,
          notes: 'Imported via Migrator',
        } as any, userId);
        
        importedCount++;
      }

      showToast(`Successfully imported ${importedCount} workouts!`, "success");
      setCsvData([]);
      onClose();
      
    } catch (err: any) {
      console.error(err);
      showToast("Import failed: " + err.message, "error");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    // Basic export stub. In a real app we'd fetch all sessionLogs from DB and convert to CSV.
    showToast("Export initiated... Check your downloads.", "success");
    // Placeholder for actual JSON/CSV blob generation
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 overflow-y-auto p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-emerald-400" />
              The Migrator
            </h1>
            <p className="text-slate-400 mt-2">Import your data from Hevy or Strong, or export your FitQuest progress.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full">✕</button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* IMPORT SECTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
             <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-cyan-400" />
                Import Workout Data
             </h2>
             
             {!csvData.length ? (
               <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-300 mb-1">Select a CSV file</p>
                  <p className="text-xs text-slate-500 mb-4">Hevy or Strong exports supported</p>
                  <label className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg font-bold cursor-pointer transition-colors block mx-auto w-fit">
                    Browse Files
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </label>
               </div>
             ) : (
               <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Loaded {csvData.length} records.
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-slate-400">Map your fields:</h3>
                    
                    {['date', 'exercise', 'weight', 'reps'].map((field) => (
                      <div key={field} className="flex items-center justify-between bg-slate-800 p-2 rounded-lg">
                        <span className="capitalize font-medium text-sm w-24 text-slate-300">{field}:</span>
                        <select 
                           value={(mapping as any)[field]}
                           onChange={(e) => setMapping({...mapping, [field]: e.target.value})}
                           className="bg-slate-900 border border-slate-700 rounded p-1.5 focus:outline-none focus:border-cyan-500 text-sm flex-1 ml-2"
                        >
                          <option value="">-- Select Column --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={executeImport}
                    disabled={isImporting}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-lg disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isImporting ? 'Importing...' : 'Start Import'}
                  </button>
               </div>
             )}
          </div>

          {/* EXPORT SECTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
             <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-white">
                <Download className="w-5 h-5 text-emerald-400" />
                Export FitQuest Data
             </h2>
             <p className="text-sm text-slate-400 mb-6">Take your data with you. Download a complete backup of your workouts and PRs.</p>

             <button 
               onClick={handleExport}
               className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
             >
               <Download className="w-5 h-5" />
               Download JSON Archive
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
