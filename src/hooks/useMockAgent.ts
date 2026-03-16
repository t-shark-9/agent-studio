import { useCallback } from 'react';
import type { ContextType } from '@/types/chat';

const MOCK_RESPONSES: Record<string, string[]> = {
  trip: [
    "I'd love to help you plan your trip! Let me put together an itinerary. I'm opening the trip planner on the right panel so we can work on the details together.\n\nHere's what I'm thinking:\n- **Day 1**: Arrival and city exploration\n- **Day 2**: Key attractions and cultural sites\n- **Day 3**: Local food tour and hidden gems\n\nWould you like to adjust the dates or budget?",
    "Great choice of destination! I've loaded up the itinerary builder. You can customize dates, budget, and preferences in the panel on the right.\n\nShall I also look into flights and accommodation options?",
  ],
  booking: [
    "I'll help you book a restaurant! I've opened the booking form on the right. Here are some top-rated options:\n\n🍽️ **The Golden Fork** - Fine dining, $$$$\n🍽️ **Casa Bella** - Italian, $$$\n🍽️ **Street Bites** - Casual, $$\n\nWhich one catches your eye? You can also fill in your preferences in the booking panel.",
    "Let me pull up the reservation system for you. I've opened the booking widget — just select your preferred date, time, and party size.",
  ],
  media: [
    "I can generate that for you! I've opened the media creation panel on the right. Here's what I can create:\n\n🎨 **Image Generation** - Photorealistic or artistic styles\n📹 **Video Creation** - Short clips and animations\n\nDescribe what you'd like and I'll get started!",
    "Creative time! I've loaded the media generator. You can describe the image or video you want, choose a style, and I'll generate it for you.",
  ],
  chat: [
    "I'm your AI agent assistant. I can help you with:\n\n🗺️ **Trip Planning** - Say \"Plan a trip to Paris\"\n🍽️ **Restaurant Booking** - Say \"Book a restaurant\"\n🎨 **Media Generation** - Say \"Create an image of...\"\n\nOr just chat with me about anything!",
    "Hello! I'm here to help. I can plan trips, book restaurants, generate images/videos, and much more. What would you like to do?",
    "That's interesting! Let me think about that...\n\nI can assist with planning, booking, creating media, or just having a conversation. What's on your mind?",
  ],
};

export function useMockAgent() {
  const getResponse = useCallback(async (message: string, contextType: ContextType): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const responses = MOCK_RESPONSES[contextType] || MOCK_RESPONSES.chat;
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  return { getResponse };
}
