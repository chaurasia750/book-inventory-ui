import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface Step {
  id: number;
  label: string;
}

@Component({
  selector: 'app-lead-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-x-auto -mx-4 px-4">
      <div class="flex items-center justify-center min-w-max gap-6 sm:gap-10 md:gap-16">
        @for (step of steps(); track step.id; let i = $index) {
          <div class="flex flex-col items-center">
            <div class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300"
                 [class]="currentStep() > i + 1 ? 'bg-[#66B42A] text-black shadow-sm shadow-[#66B42A]/30' :
                           currentStep() === i + 1 ? 'bg-[#66B42A] text-black shadow-sm shadow-[#66B42A]/30' :
                           'bg-white text-gray-400 ring-1 ring-gray-200'">
              @if (currentStep() > i + 1) {
                <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              } @else {
                <span>{{ i + 1 }}</span>
              }
            </div>
            <span class="mt-2.5 text-xs font-medium transition-colors duration-300"
                  [class]="currentStep() >= i + 1 ? 'text-gray-900' : 'text-gray-400'">{{ step.label }}</span>
          </div>
          @if (i < steps().length - 1) {
            <div class="flex items-center">
              <div class="h-px w-8 transition-colors duration-300 sm:w-12 md:w-20"
                   [class]="currentStep() >= i + 2 ? 'bg-[#66B42A]' : 'bg-gray-200'"></div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class LeadStepperComponent {
  readonly steps = input<Step[]>([]);
  readonly currentStep = input(1);
}
