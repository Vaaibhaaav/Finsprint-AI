import { GoalRequest, GoalType } from "@/types/types";
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface GoalsStore {
    loading: boolean;
    err: Error | null;
    goals: GoalType[];
    selectedGoal: GoalType | null;
    setSelectedGoal: (goal: GoalType | null) => void;
    fetchGoals: (api: any) => Promise<void>;
    postNewGoal: (goal: GoalRequest, api: any) => Promise<void>;
    updateGoal: (goal: any, api: any) => Promise<void>;
    deleteGoal: (id: string, api: any) => Promise<void>;
}

export const useGoalsStore = create<GoalsStore>()(
    persist(
        (set, get) => ({
            loading: false,
            err: null,
            goals: [],
            selectedGoal: null,
            setSelectedGoal: (goal: GoalType | null) => set({ selectedGoal: goal }),
            fetchGoals: async (api: any) => {
                set({ loading: true });
                try {
                    const response = await api.get("/api/v1/goals");
                    const data = response.data;
                    set({ goals: data });
                } catch (error) {
                    set({ err: error as Error });
                } finally {
                    set({ loading: false });
                }
            },
            postNewGoal: async (goal: GoalRequest, api: any) => {
                set({ loading: true });
                try {
                    const response = await api.post("/api/v1/goals", {
                        name: goal.Name,
                        type: goal.Type,
                        description: goal.Description,
                        target_amount: Number(goal.TargetAmount),
                        saved_amount: Number(goal.SavedAmount),
                        weekly_target: goal.WeeklyTarget ? Number(goal.WeeklyTarget) : null,
                        deadline: goal.Deadline ? new Date(goal.Deadline).toISOString() : null
                    });
                    const data = response.data;
                    set({ goals: [...get().goals, data] });
                } catch (error) {
                    set({ err: error as Error });
                } finally {
                    set({ loading: false });
                }
            },
            updateGoal: async (goal: any, api: any) => {
                set({ loading: true });
                try {
                    const response = await api.put(`/api/v1/goals/${goal.id as string}`, goal);
                    const data = response.data;
                    set({ goals: get().goals.map((g) => (g.ID === goal.id ? data : g)) });
                } catch (error) {
                    set({ err: error as Error });
                } finally {
                    set({ loading: false });
                }
            },
            deleteGoal: async (id: string, api: any) => {
                set({ loading: true });
                try {
                    await api.delete(`/api/v1/goals/${id}`);
                    set({ goals: get().goals.filter((g) => g.ID !== id) });
                } catch (error) {
                    set({ err: error as Error });
                } finally {
                    set({ loading: false });
                }
            },
        }),
        {
            name: "goals-storage",
            partialize: (state) => ({
                selectedGoal: state.selectedGoal,
            }),
        }
    )
);
