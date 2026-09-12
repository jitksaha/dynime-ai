<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AiPlan;
use Illuminate\Support\Facades\Auth;

class PricingController extends Controller
{
    /**
     * Display standalone Pricing page.
     */
    public function index(Request $request)
    {
        $plans = AiPlan::active()->get();
        $user = Auth::user();
        $currentPlanSlug = $user ? ($user->current_plan_slug ?? 'free') : 'free';

        return Inertia::render('Pricing/Index', [
            'plans' => $plans,
            'currentPlanSlug' => $currentPlanSlug,
        ]);
    }

    /**
     * API to fetch all active plans and user current plan.
     */
    public function getPlans(Request $request)
    {
        $plans = AiPlan::active()->get();
        $user = Auth::user();
        $currentPlanSlug = $user ? ($user->current_plan_slug ?? 'free') : 'free';

        return response()->json([
            'plans' => $plans,
            'current_plan_slug' => $currentPlanSlug,
        ]);
    }

    /**
     * API to select or update plan (gateway integration will connect next).
     */
    public function selectPlan(Request $request)
    {
        $validated = $request->validate([
            'plan_slug' => 'required|string|exists:ai_plans,slug',
        ]);

        $user = Auth::user();
        if ($user) {
            $user->current_plan_slug = $validated['plan_slug'];
            $user->save();
        }

        $selectedPlan = AiPlan::where('slug', $validated['plan_slug'])->first();

        return response()->json([
            'success' => true,
            'message' => 'Plan updated to ' . ($selectedPlan->name ?? 'Free'),
            'current_plan_slug' => $validated['plan_slug'],
            'plan' => $selectedPlan,
        ]);
    }
}
