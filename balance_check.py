
import math

# =============================================================================
# DATA DEFINITIONS
# =============================================================================

MOVES = ["punch", "kick", "block", "special"]

MOVE_STATS = {
    "punch": {"damage": 10, "beats": ["kick"]},
    "kick": {"damage": 15, "beats": ["block"]},
    "block": {"damage": 0, "beats": ["punch"]},
    "special": {"damage": 25, "beats": ["punch", "kick"]}, # Beat punch/kick
    "stunned": {"damage": 0, "beats": []} # Ignored for basic sim
}

DAMAGE_MULTIPLIERS = {
    "WIN": 1.0,
    "TIE": 0.5, # Same move
    "LOSE": 0.0,
    "BLOCKED": 0.5, # Block vs Attack (if block fails? No, if Block beats Attack)
                    # Wait, CONSTANTS said: "Blocked damage reduction: 0.5"
                    # But RESOLUTION says: Block beats Punch.
                    # round-resolver: calculateDamage: if defender beats attacker, return 0.
                    # So Block beats Punch -> Punch does 0 damage?
                    # Let's re-read round-resolver carefully. 
                    # "If defender's move beats attacker's move, no damage."
                    # So Block beats Punch => Punch does 0 damage.
                    # But Kick beats Block => Block fails?
                    # Kick beats Block => Kick does Damage?
                    # round-resolver: "If attacker's move beats defender's move... full damage".
                    # Kick beats Block -> Kick deals 15 damage.
}

# Corrected Logic based on round-resolver.ts:
# Attacker A vs Defender B
# 1. A beats B -> A deals Damage (Bonus Counter if applicable)
# 2. B beats A -> A deals 0 Damage
# 3. A == B -> Both deal Reduced Damage (SAME_MOVE: 0.5)
# 4. Special vs Block -> Special beats Block (Shatter), Block beats Special?
#    RESOLTION MATRIX: "special" keys: "block": "hit" (Special shatters block)
#    "block" keys: "special": "shattered".
#    So Special beats Block.

# Character Stats (Simplified version of CharacterStats.ts)
CHARACTERS = {
    "cyber-ninja": {"maxHp": 96, "damageModifiers": {"punch": 1.15, "kick": 1.05, "block": 1.0, "special": 1.0}},
    "neon-wraith": {"maxHp": 92, "damageModifiers": {"punch": 1.1, "kick": 1.1, "block": 1.0, "special": 1.15}},
    "kitsune-09": {"maxHp": 90, "damageModifiers": {"punch": 1.0, "kick": 1.1, "block": 1.0, "special": 1.1}},
    "viperblade": {"maxHp": 105, "damageModifiers": {"punch": 1.15, "kick": 1.15, "block": 1.0, "special": 1.1}},
    "chrono-drifter": {"maxHp": 120, "damageModifiers": {"punch": 1.1, "kick": 1.1, "block": 1.0, "special": 1.25}},
    
    "block-bruiser": {"maxHp": 115, "damageModifiers": {"punch": 1.0, "kick": 1.2, "block": 1.0, "special": 1.0}},
    "heavy-loader": {"maxHp": 135, "damageModifiers": {"punch": 1.1, "kick": 1.0, "block": 1.0, "special": 1.0}},
    "gene-smasher": {"maxHp": 115, "damageModifiers": {"punch": 1.25, "kick": 1.25, "block": 1.0, "special": 1.1}},
    "bastion-hulk": {"maxHp": 115, "damageModifiers": {"punch": 1.0, "kick": 1.0, "block": 1.0, "special": 1.1}},
    "scrap-goliath": {"maxHp": 115, "damageModifiers": {"punch": 1.1, "kick": 1.1, "block": 1.0, "special": 1.1}},
    
    "dag-warrior": {"maxHp": 100, "damageModifiers": {"punch": 1.05, "kick": 1.05, "block": 1.0, "special": 1.05}},
    "cyber-paladin": {"maxHp": 115, "damageModifiers": {"punch": 1.05, "kick": 1.05, "block": 1.0, "special": 1.05}},
    "nano-brawler": {"maxHp": 95, "damageModifiers": {"punch": 1.2, "kick": 1.0, "block": 1.0, "special": 1.1}},
    "technomancer": {"maxHp": 95, "damageModifiers": {"punch": 0.95, "kick": 0.95, "block": 1.0, "special": 1.25}},
    "aeon-guard": {"maxHp": 120, "damageModifiers": {"punch": 1.1, "kick": 1.1, "block": 1.0, "special": 1.2}},
    
    "hash-hunter": {"maxHp": 98, "damageModifiers": {"punch": 1.0, "kick": 1.1, "block": 1.0, "special": 1.2}},
    "razor-bot-7": {"maxHp": 95, "damageModifiers": {"punch": 1.05, "kick": 1.05, "block": 1.0, "special": 1.3}},
    "sonic-striker": {"maxHp": 105, "damageModifiers": {"punch": 1.15, "kick": 1.15, "block": 1.0, "special": 1.0}},
    "prism-duelist": {"maxHp": 100, "damageModifiers": {"punch": 1.05, "kick": 1.05, "block": 1.0, "special": 1.2}},
    "void-reaper": {"maxHp": 95, "damageModifiers": {"punch": 1.25, "kick": 1.25, "block": 1.0, "special": 1.25}},
}

CARDS = [
    {"id": "dag-overclock", "type": "damage_multiplier", "params": {"damageMultiplier": 1.85, "incomingDamageReduction": 0.0}}, # Buffed from 1.75
    {"id": "block-fortress", "type": "damage_reflect", "params": {"reflectPercent": 10.5}}, # Reduced from 11.0
    {"id": "tx-storm", "type": "energy_regen_with_cost", "params": {"energyRegenBonus": 38, "hpCost": 5}}, # Reduced from 42
    {"id": "mempool-congest", "type": "opponent_stun", "params": {"hpCost": 7}}, # Keep 7 (6.84)
    {"id": "blue-set-heal", "type": "hp_regen", "params": {"hpRegen": 6.5}}, # Try float
    {"id": "orphan-smasher", "type": "counter_multiplier", "params": {"counterMultiplier": 2.25}}, # Reduced from 2.3
    {"id": "10bps-barrage", "type": "energy_regen", "params": {"energyRegenBonus": 22}}, # Keep (6.60)
    {"id": "pruned-rage", "type": "fury_boost", "params": {"damageMultiplier": 1.6, "blockDisabled": True}}, # Keep (6.60)
    {"id": "sompi-shield", "type": "damage_reduction", "params": {"incomingDamageReduction": 0.82}}, # Reduced from 0.85
    {"id": "hash-hurricane", "type": "random_win", "params": {"randomWinChance": 0.82}}, # Reduced from 0.85
    {"id": "ghost-dag", "type": "energy_drain", "params": {"energyDrain": 22}}, # New Effect
    {"id": "finality-fist", "type": "critical_special", "params": {"damageMultiplier": 2.25}}, # Increased from 2.2
    {"id": "bps-blitz", "type": "lifesteal", "params": {"lifestealPercent": 0.82}}, # Increased from 0.75
    {"id": "vaultbreaker", "type": "energy_steal", "params": {"energySteal": 35}}, # Keep (6.56)
    {"id": "chainbreaker", "type": "guard_break", "params": {"damageMultiplier": 1.53}}, # Reduced from 1.55 to 1.53
]


# =============================================================================
# SIMULATION ENGINE
# =============================================================================

def does_move_beat(move_a, move_b):
    if move_a == "stunned": return False
    if move_b == "stunned": return True
    return move_b in MOVE_STATS[move_a]["beats"]

def calculate_raw_damage(attacker_move, defender_move):
    base_dmg = MOVE_STATS[attacker_move]["damage"]
    
    if does_move_beat(attacker_move, defender_move):
        return base_dmg * 1.0 # Win
    elif does_move_beat(defender_move, attacker_move):
        return 0 # Lose
    else:
        # Tie
        return base_dmg * 0.5 # SAME_MOVE

def simulate_round_move_outcome(att_char_id, def_char_id, att_move, def_move, att_card=None):
    """
    Returns (att_dmg_dealt, def_dmg_dealt, att_hp_change, def_hp_change, att_energy_change)
    """
    
    att_stats = CHARACTERS[att_char_id]
    def_stats = CHARACTERS[def_char_id]
    
    # --- HANDLING STUN ---
    # Effect: opponent_stun -> Opponent's move is treated as "stunned"
    if att_card and att_card["type"] == "opponent_stun":
        def_move = "stunned"

    # --- PRE-CALC MODIFIERS ---
    att_dmg_mult = att_stats["damageModifiers"].get(att_move, 1.0)
    def_dmg_mult = def_stats["damageModifiers"].get(def_move, 1.0)
    
    # Defaults
    att_incoming_reduction = 0.0
    att_extra_dmg_bonus = 1.0
    att_counter_mult = 1.0
    att_block_disabled = False
    hp_cost_instant = 0
    hp_regen_instant = 0
    att_lifesteal_percent = 0.0
    att_energy_drain_passive = 0
    
    if att_card:
        ctype = att_card["type"]
        params = att_card["params"]
        
        # --- UNIVERSAL PARAMS ---
        # Apply generic modifiers if present, regardless of type
        att_extra_dmg_bonus = params.get("damageMultiplier", att_extra_dmg_bonus)
        att_incoming_reduction = params.get("incomingDamageReduction", att_incoming_reduction)
        hp_regen_instant = params.get("hpRegen", hp_regen_instant)
        hp_cost_instant = params.get("hpCost", hp_cost_instant)
        att_lifesteal_percent = params.get("lifestealPercent", 0.0)
        att_energy_drain_passive = params.get("energyDrain", 0)
        
        # --- TYPE SPECIFIC LOGIC ---
        if ctype == "counter_multiplier":
            att_counter_mult = params.get("counterMultiplier", 1.0)
            
        elif ctype == "fury_boost":
            if params.get("blockDisabled"):
                att_block_disabled = True
                
        elif ctype == "lifesteal":
            att_lifesteal_percent = params.get("lifestealPercent", 0.5)

        elif ctype == "random_win" or ctype == "invisible_move":
            # Simplified: Dodge chance = damage reduction on average
            if att_incoming_reduction == 0.0:
                att_incoming_reduction = params.get("randomWinChance", 0.0)
            
        elif ctype == "critical_special":
            # Only apply bonus IF move is special
            if att_move != "special":
                att_extra_dmg_bonus = 1.0 # Reset if not special
    # --- MOVE LEGALITY ---
    if att_block_disabled and att_move == "block":
        # Player cannot block, treat as "Stunned" or "skip"
        # Simplification: They do nothing, take full damage (like being stunned)
        # But for simulation, let's assume they picked a different move?
        # Or if we iterate all moves, this case yields 0 dmg dealt, normal taken.
        return (0, calculate_raw_damage(def_move, "stunned") * def_stats["damageModifiers"].get(def_move, 1.0), -hp_cost_instant + hp_regen_instant, 0, 0)
    
    # --- RESOLVE DAMAGE ---
    
    # 1. Base Resolution
    att_wins = does_move_beat(att_move, def_move)
    def_wins = does_move_beat(def_move, att_move)
    tie = (att_move == def_move)
    
    raw_att_dmg = calculate_raw_damage(att_move, def_move)
    raw_def_dmg = calculate_raw_damage(def_move, att_move)
    
    # 2. Apply Stats
    final_att_dmg = raw_att_dmg * att_dmg_mult
    final_def_dmg = raw_def_dmg * def_dmg_mult
    
    # 3. Apply Card Dynamic Effects
    
    if att_card:
        ctype = att_card["type"]
        params = att_card["params"]
        
        # Counter Multiplier
        if ctype == "counter_multiplier" and att_wins:
            final_att_dmg *= att_counter_mult
            
        # Damage Reflect
        if ctype == "damage_reflect":
            # If Attacker is Blocking and Defender Attacks
            if att_move == "block" and def_move in ["punch", "kick"]:
                # Logic: Block beats Punch (Takes 0), Kick beats Block (Takes 15)
                # "Blocks reflect 75% damage". 
                # If I succesfully block (vs Punch), I reflect?
                # or Attacker (Blocking) reflects the punch?
                # Yes, if I block punch, I take 0, they take reflect.
                if att_wins: # Block beats Punch
                    # Def punch damage was 10. Reflect 7.5.
                    final_att_dmg += 10 * params.get("reflectPercent", 0)
        
        # Guard Break
        if ctype == "guard_break":
            # "Break guard on any hit"
            # If Attacker Attacks vs Block. Normally 0 dmg for Attacker.
            # Now, Block fails.
            if def_move == "block" and att_move in ["punch", "kick", "special"]:
                # Force win
                final_att_dmg = MOVE_STATS[att_move]["damage"] * att_dmg_mult # Full damage
                # And Defender deals 0 (since they blocked)
                final_def_dmg = 0
    
    # Apply Card Dmg Multiplier (Generic)
    final_att_dmg *= att_extra_dmg_bonus
    
    # Apply Incoming Reduction (Generic)
    # Note: incomingDamageReduction = 0.6 means damage * (1 - 0.6) = damage * 0.4
    # incomingDamageReduction = -0.25 means damage * (1 - (-0.25)) = damage * 1.25
    final_def_dmg *= (1.0 - att_incoming_reduction)
    
    # Net Health Changes
    # Lifesteal: Heal % of final_att_dmg
    heal_from_lifesteal = final_att_dmg * att_lifesteal_percent
    
    att_hp_change = -final_def_dmg + hp_regen_instant - hp_cost_instant + heal_from_lifesteal
    def_hp_change = -final_att_dmg
    
    # Energy Changes (Card Effects Only for now)
    att_energy_change = 0
    if att_card:
        params = att_card["params"]
        att_energy_change += params.get("energyRegenBonus", 0)
        # energyBurn is for opponent, not attacker's energy change here.
        
        if att_card["type"] == "energy_steal":
             if att_wins:
                 att_energy_change += params.get("energySteal", 0)

        # Passive Drain (GhostDAG)
        # Treat opponent loss as our gain for simple balance score
        att_energy_change += att_energy_drain_passive
                 
    return (final_att_dmg, final_def_dmg, att_hp_change, def_hp_change, att_energy_change)

def calculate_card_score_for_pair(att_char, def_char, card):
    """
    Calculates the 'Value' of the card in this specific matchup.
    Value = Net HP + (Net Energy * 0.3)
    """
    ENERGY_VAL = 0.3
    
    # 1. Baseline (No Card)
    base_score = 0
    count = 0
    for am in MOVES:
        for dm in MOVES:
            # Baseline: att_card=None
            # Returns: (final_att_dmg, final_def_dmg, att_hp_change, def_hp_change, att_energy_change)
            _, _, att_hp, def_hp, att_en = simulate_round_move_outcome(att_char, def_char, am, dm, None)
            
            # Score = Advantage (My HP Delta - Opp HP Delta) + Utility (Energy)
            score = (att_hp - def_hp) + (att_en * ENERGY_VAL)
            base_score += score
            count += 1
            
    base_avg = base_score / count
    
    # 2. With Card
    card_score = 0
    count = 0
    for am in MOVES:
        for dm in MOVES:
            _, _, att_hp, def_hp, att_en = simulate_round_move_outcome(att_char, def_char, am, dm, card)
            
            # Special handling for OPPONENT energy loss (simulated as value for us)
            opp_energy_loss = 0
            ctype = card["type"]
            params = card["params"]
            
            if ctype == "energy_burn":
                # If we hit, opponent loses energy
                att_wins = does_move_beat(am, dm)
                if att_wins: 
                    opp_energy_loss = params.get("energyBurn", 0)
            
            if ctype == "energy_steal":
                att_wins = does_move_beat(am, dm)
                if att_wins:
                    opp_energy_loss = params.get("energySteal", 0) # They lose it too
            
            # Opponent losing energy is Good for us.
            score = (att_hp - def_hp) + (att_en * ENERGY_VAL) + (opp_energy_loss * ENERGY_VAL)
            card_score += score
            count += 1
            
    card_avg = card_score / count
    
    return card_avg - base_avg

# =============================================================================
# MAIN ANALYSIS
# =============================================================================

def run_analysis():
    print("Running Power Surge Balance Analysis...")
    print(f"Total Characters: {len(CHARACTERS)}")
    print(f"Total Cards: {len(CARDS)}")
    
    card_scores = {}
    
    for card in CARDS:
        total_score = 0
        matchups = 0
        
        for att_id in CHARACTERS:
            for def_id in CHARACTERS:
                # if att_id == def_id: continue # Mirror matches happen, include them
                
                score = calculate_card_score_for_pair(att_id, def_id, card)
                total_score += score
                matchups += 1
        
        avg_score = total_score / matchups
        card_scores[card["id"]] = avg_score
    
    # Sort and Print
    sorted_cards = sorted(card_scores.items(), key=lambda x: x[1], reverse=True)
    
    print("\n--- CARD BALANCE RANKING (Estimated Round Advantage) ---")
    print("(Positive = Good, Negative = Bad/Harmful)")
    
    with open("balance_results.txt", "w") as f:
        for rank, (cid, score) in enumerate(sorted_cards, 1):
            # Find card name
            card_info = next(c for c in CARDS if c["id"] == cid)
            desc = str(card_info["params"])
            line = f"{rank}. {cid:<20} Score: {score:+.2f}  [{desc}]"
            print(line)
            f.write(line + "\n")

if __name__ == "__main__":
    run_analysis()
