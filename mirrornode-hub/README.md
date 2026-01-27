# Fox Story - Chapter One

A calm, curious interactive story about a fox's journey through the borderlands between meadow, forest, and the crossroads beyond.

## How to Play

1. Open `index.html` in a web browser
2. Click "Begin the Journey" to start the story
3. Read each passage and choose from the available options
4. Your choices are remembered throughout the session
5. The story concludes when you reach one of three endings
6. Click "Journey Again" to restart and explore different paths

## Story Structure

### Realms
- **Meadow**: The starting point, filled with golden grass and morning light
- **Forest**: Cool shadows, ancient trees, and hidden springs
- **Crossroads**: Where paths converge and choices matter most

### Choice System
- Each choice subtly alters the narrative tone and environment
- Choices are remembered and influence available options
- No "wrong" choices—each path offers a unique perspective
- Three distinct endings based on your journey's conclusion

### State Persistence
- Story progress is saved automatically
- Refreshing the page maintains your current position
- Choices persist until you complete the story or restart

## How to Extend

### Adding New Realms

1. **Define the Realm**: Add new realm identifier to the `realms` array
2. **Create Screens**: Add new screen divs with unique IDs
3. **Add Transitions**: Update the `transitions` object in `getNextScreen()`
4. **Style the Realm**: Add atmospheric CSS classes for the new realm

### Adding New Choices

1. **Add Choice Button**: Include new choice button in screen HTML
2. **Handle Choice**: Add choice handler to `makeChoice()`
3. **Update Transitions**: Add choice-to-screen mapping

### Example: Adding the Lake Realm

```html
<!-- Add new screen -->
<div class="screen" id="lake1">
    <p class="story-text">The lake spreads before you...</p>
    <div class="choices">
        <button class="choice-btn" onclick="makeChoice('lake', 'swim')">
            Swim in the clear water
        </button>
        <button class="choice-btn" onclick="makeChoice('lake', 'shore')">
            Walk along the shoreline
        </button>
    </div>
</div>
```

```javascript
// Add to transitions object
transitions: {
    crossroads: {
        'hills': 'lake1',  // Now leads to lake
        // ... other choices
    },
    lake: {
        'swim': 'ending_lake',
        'shore': 'ending_lake_shore'
    }
}
```

### Narrative Guidelines

- **Show, don't tell**: Let the environment reveal story through observation
- **Subtle consequences**: Small changes in text, tone, or atmosphere
- **Respect player agency**: Choices should feel meaningful but not punishing
- **Maintain tone**: Calm, curious, slightly mythic, grounded

### Technical Guidelines

- **State Management**: Use `localStorage` for persistence
- **Progress Tracking**: Update progress bar based on story beats
- **Atmosphere**: Match background gradients to current realm
- **Responsive Design**: Test on mobile devices

## Story Philosophy

This is a story with integrity, not a feature demo. Each choice should feel like a natural extension of the fox's character—a creature observant, cautious, but ultimately curious about the world beyond familiar hunting grounds.

The narrative space is intentionally left open for future connections to a broader resonance/matchmaking experience, but this first chapter must stand completely on its own as a complete, satisfying story.