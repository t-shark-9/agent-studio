import { useCallback } from 'react';
import type { ContextType } from '@/types/chat';

interface AgentResponse {
  content: string;
  canvasId?: string;
}

const MOCK_RESPONSES: Record<string, AgentResponse[]> = {
  trip: [
    {
      content: "I've set up an interactive trip planner for you! Check out the canvas panel on the right to explore destinations, pick dates, and build your itinerary.",
      canvasId: 'trip-planner-demo',
    },
    {
      content: "Great choice! I've loaded the trip planning canvas. You can browse flights, hotels, and activities right in the panel.",
      canvasId: 'trip-explore-demo',
    },
  ],
  booking: [
    {
      content: "I've opened the restaurant booking experience for you! Browse restaurants, pick a date, and reserve your table in the canvas panel.",
      canvasId: 'booking-restaurants-demo',
    },
    {
      content: "Let me pull up some great options! Check the canvas panel to browse restaurants and make a reservation.",
      canvasId: 'booking-browse-demo',
    },
  ],
  media: [
    {
      content: "The media studio is ready! Use the canvas panel to describe your vision, pick a style, and generate your creation.",
      canvasId: 'media-studio-demo',
    },
    {
      content: "Creative time! I've opened the media generator canvas. Describe what you'd like and choose a style.",
      canvasId: 'media-create-demo',
    },
  ],
  chat: [
    {
      content: "I'm your AI agent assistant. I can help you with:\n\n🗺️ **Trip Planning** - Say \"Plan a trip to Paris\"\n🍽️ **Restaurant Booking** - Say \"Book a restaurant\"\n🎨 **Media Generation** - Say \"Create an image of...\"\n\nOr just chat with me about anything!",
    },
    {
      content: "Hello! I'm here to help. I can plan trips, book restaurants, generate images/videos, and much more. What would you like to do?",
    },
  ],
};

export function useMockAgent() {
  const getResponse = useCallback(async (message: string, contextType: ContextType): Promise<AgentResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const responses = MOCK_RESPONSES[contextType] || MOCK_RESPONSES.chat;
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  return { getResponse };
}
