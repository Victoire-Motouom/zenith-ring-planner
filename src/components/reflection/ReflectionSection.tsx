import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Wind, Lightbulb, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/database";
import type { Reflection } from "@/lib/database";

export default function ReflectionSection() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [currentReflection, setCurrentReflection] = useState('');
  const [todaysPrompt, setTodaysPrompt] = useState<{ring: string, prompt: string}>({
    ring: 'wind',
    prompt: ''
  });

  const musashiPrompts = {
    earth: [
      "How did I maintain discipline in my daily habits today?",
      "What foundation did I strengthen in my life today?",
      "Where did I show consistency despite challenges?",
      "How did I honor my commitments to myself today?"
    ],
    water: [
      "How did I adapt to unexpected challenges today?",
      "Where did I flow around obstacles rather than forcing through them?",
      "What flexibility did I demonstrate in changing circumstances?",
      "How did I remain calm in the face of uncertainty?"
    ],
    fire: [
      "What decisive action did I take today?",
      "Where did I show courage in pursuing my goals?",
      "How did I direct my energy toward what matters most?",
      "What bold step forward did I make today?"
    ],
    wind: [
      "What did I learn about myself today?",
      "How did I observe patterns in my behavior or thoughts?",
      "What wisdom emerged from today's experiences?",
      "How am I evolving in my understanding?"
    ],
    void: [
      "What insights came to me in moments of stillness?",
      "How did I trust my intuition today?",
      "What emerged from beyond conscious thought?",
      "How did I connect with my deeper wisdom?"
    ]
  };

  useEffect(() => {
    const loadReflections = async () => {
      const allReflections = await db.reflections
        .orderBy('date')
        .reverse()
        .limit(10)
        .toArray();
      setReflections(allReflections);
    };

    // Set today's prompt
    const today = new Date();
    const rings = Object.keys(musashiPrompts);
    const ringIndex = today.getDate() % rings.length;
    const selectedRing = rings[ringIndex];
    const prompts = musashiPrompts[selectedRing as keyof typeof musashiPrompts];
    const promptIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24)) % prompts.length;
    
    setTodaysPrompt({
      ring: selectedRing,
      prompt: prompts[promptIndex]
    });

    loadReflections();
  }, []);

  const saveReflection = async () => {
    if (!currentReflection.trim()) return;

    try {
      await db.reflections.add({
        date: new Date(),
        ring: todaysPrompt.ring as 'earth' | 'water' | 'fire' | 'wind' | 'void',
        prompt: todaysPrompt.prompt,
        content: currentReflection,
        createdAt: new Date()
      });

      setCurrentReflection('');
      
      // Reload reflections
      const allReflections = await db.reflections
        .orderBy('date')
        .reverse()
        .limit(10)
        .toArray();
      setReflections(allReflections);
    } catch (error) {
      console.error('Failed to save reflection:', error);
    }
  };

  const getRingColor = (ring: string) => {
    switch(ring) {
      case 'earth': return 'bg-earth-ring text-white';
      case 'water': return 'bg-water-ring text-white';
      case 'fire': return 'bg-fire-ring text-white';
      case 'wind': return 'bg-wind-ring text-white';
      case 'void': return 'bg-void-ring text-white';
      default: return 'bg-muted';
    }
  };

  const getRingPhilosophy = (ring: string) => {
    switch(ring) {
      case 'earth': return 'Foundation & Discipline';
      case 'water': return 'Adaptability & Flow';
      case 'fire': return 'Decisive Action';
      case 'wind': return 'Observation & Learning';
      case 'void': return 'Intuition & Insight';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-zenith bg-clip-text text-transparent">
          Daily Reflection & Wisdom
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Following Musashi's Five Rings philosophy, cultivate wisdom through daily contemplation. 
          Each reflection deepens your understanding and guides your path to mastery.
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          {Object.keys(musashiPrompts).map(ring => (
            <Badge key={ring} className={`${getRingColor(ring)} capitalize`}>
              {ring} Ring
            </Badge>
          ))}
        </div>
      </div>

      {/* Today's Reflection */}
      <Card className="shadow-zenith bg-gradient-subtle">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className={`${getRingColor(todaysPrompt.ring)} capitalize`}>
              {todaysPrompt.ring} Ring
            </Badge>
            <span className="text-sm text-muted-foreground">
              {getRingPhilosophy(todaysPrompt.ring)}
            </span>
          </div>
          <CardTitle className="text-xl">Today's Contemplation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-card p-4 rounded-lg border-l-4 border-primary">
            <p className="text-lg italic text-foreground">
              "{todaysPrompt.prompt}"
            </p>
          </div>
          
          <Textarea
            placeholder="Reflect deeply on today's experiences. What wisdom emerges from honest observation?"
            value={currentReflection}
            onChange={(e) => setCurrentReflection(e.target.value)}
            rows={6}
            className="text-base"
          />
          
          <Button 
            onClick={saveReflection}
            disabled={!currentReflection.trim()}
            variant="zenith" 
            className="w-full gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Record Today's Wisdom
          </Button>
        </CardContent>
      </Card>

      {/* Past Reflections */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Wind className="h-5 w-5 text-wind-ring" />
          Journal of Wisdom
        </h2>

        {reflections.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="text-center py-8">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Your wisdom begins with the first reflection. Start your journey of self-discovery.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reflections.map((reflection) => (
              <Card key={reflection.id} className="shadow-soft hover:shadow-zenith transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getRingColor(reflection.ring)} capitalize text-xs`}>
                        {reflection.ring}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {reflection.date.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm italic text-muted-foreground border-l-2 border-muted pl-3">
                    "{reflection.prompt}"
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">
                    {reflection.content}
                  </p>
                  {reflection.insights && (
                    <div className="mt-3 p-3 bg-accent/50 rounded-lg">
                      <p className="text-sm font-medium text-accent-foreground flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Key Insight
                      </p>
                      <p className="text-sm text-accent-foreground mt-1">
                        {reflection.insights}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}