import { useState } from 'react';
import { Clock, Users, MapPin, Star, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BookingWidgetProps {
  onAction: (message: string) => void;
}

const RESTAURANTS = [
  { name: 'The Golden Fork', cuisine: 'Fine Dining', rating: 4.8, price: '$$$$', available: true },
  { name: 'Casa Bella', cuisine: 'Italian', rating: 4.5, price: '$$$', available: true },
  { name: 'Street Bites', cuisine: 'Casual', rating: 4.2, price: '$$', available: false },
  { name: 'Sakura Garden', cuisine: 'Japanese', rating: 4.7, price: '$$$', available: true },
];

export function BookingWidget({ onAction }: BookingWidgetProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);

  const handleBook = () => {
    if (selectedRestaurant === null) return;
    const restaurant = RESTAURANTS[selectedRestaurant];
    onAction(`I'd like to book ${restaurant.name} for ${guests} guests on ${date || 'a date TBD'} at ${time || 'a time TBD'}.`);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Booking Details */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Reservation Details</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <CalendarDays className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="pl-8 h-9 text-xs bg-secondary border-border"
            />
          </div>
          <div className="relative">
            <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="pl-8 h-9 text-xs bg-secondary border-border"
            />
          </div>
        </div>
        <div className="relative">
          <Users className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="number"
            placeholder="Guests"
            value={guests}
            onChange={e => setGuests(e.target.value)}
            className="pl-8 h-9 text-xs bg-secondary border-border"
            min="1"
            max="20"
          />
        </div>
      </div>

      {/* Restaurant List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Available Restaurants</h3>
        {RESTAURANTS.map((r, idx) => (
          <div
            key={r.name}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              selectedRestaurant === idx
                ? 'bg-primary/10 border border-primary/20'
                : r.available
                ? 'bg-secondary hover:bg-surface-hover'
                : 'bg-secondary/50 opacity-50 cursor-not-allowed'
            }`}
            onClick={() => r.available && setSelectedRestaurant(idx)}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-medium text-foreground">{r.name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{r.cuisine}</span>
                  <span className="text-[10px] text-muted-foreground">{r.price}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-primary fill-primary" />
                <span className="text-[10px] text-foreground font-medium">{r.rating}</span>
              </div>
            </div>
            {!r.available && (
              <span className="text-[10px] text-destructive mt-1 block">Fully booked</span>
            )}
          </div>
        ))}
      </div>

      {/* Book Button */}
      <Button
        size="sm"
        className="w-full h-8 text-xs"
        onClick={handleBook}
        disabled={selectedRestaurant === null}
      >
        Reserve Table
      </Button>
    </div>
  );
}
