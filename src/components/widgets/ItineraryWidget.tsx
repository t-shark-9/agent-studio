import { useState } from 'react';
import { Calendar, DollarSign, MapPin, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ItineraryWidgetProps {
  onAction: (message: string) => void;
}

const SAMPLE_ACTIVITIES = [
  { day: 1, title: 'City Walking Tour', time: '10:00 AM', type: 'activity' },
  { day: 1, title: 'Museum Visit', time: '2:00 PM', type: 'culture' },
  { day: 2, title: 'Local Food Market', time: '9:00 AM', type: 'food' },
  { day: 2, title: 'Scenic Viewpoint', time: '3:00 PM', type: 'sightseeing' },
  { day: 3, title: 'Departure', time: '11:00 AM', type: 'travel' },
];

export function ItineraryWidget({ onAction }: ItineraryWidgetProps) {
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);

  const toggleActivity = (idx: number) => {
    setSelectedActivities(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Trip Details */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Trip Details</h3>
        <div className="space-y-2">
          <div className="relative">
            <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Destination"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="pl-8 h-9 text-xs bg-secondary border-border"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Travel dates"
              value={dates}
              onChange={e => setDates(e.target.value)}
              className="pl-8 h-9 text-xs bg-secondary border-border"
            />
          </div>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Budget"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="pl-8 h-9 text-xs bg-secondary border-border"
            />
          </div>
        </div>
      </div>

      {/* Itinerary */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Suggested Itinerary</h3>
        {[1, 2, 3].map(day => (
          <div key={day} className="space-y-1">
            <span className="text-[10px] font-semibold text-primary tracking-wider">DAY {day}</span>
            {SAMPLE_ACTIVITIES.filter(a => a.day === day).map((activity, idx) => {
              const globalIdx = SAMPLE_ACTIVITIES.indexOf(activity);
              const selected = selectedActivities.includes(globalIdx);
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                    selected ? 'bg-primary/10 border border-primary/20' : 'bg-secondary hover:bg-surface-hover'
                  }`}
                  onClick={() => toggleActivity(globalIdx)}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                    selected ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-foreground block truncate">{activity.title}</span>
                    <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={() => onAction(`I've selected ${selectedActivities.length} activities for my trip${destination ? ` to ${destination}` : ''}.`)}
          disabled={selectedActivities.length === 0}
        >
          Confirm {selectedActivities.length} Activities
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={() => onAction('Show me more activity suggestions for this trip.')}
        >
          <Plus className="h-3 w-3 mr-1" /> More Suggestions
        </Button>
      </div>
    </div>
  );
}
