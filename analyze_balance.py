import pandas as pd
import numpy as np

# Base Stats
BASE_MOVE_STATS = {
    "punch": {"damage": 10, "energyCost": 0},
    "kick": {"damage": 15, "energyCost": 25},
    "special": {"damage": 25, "energyCost": 50},
}

# Character Data (Extracted from CharacterStats.ts)
CHARACTERS = {
    # == LEGACY (Free) == TARGET: ~1.55
    "cyber-ninja": {
        "maxHp": 96, "maxEnergy": 105, "energyRegen": 20, # NERFED Regen -2
        "damageModifiers": {"punch": 1.15, "kick": 1.05, "special": 1.0},
        "blockEffectiveness": 0.6, "specialCostModifier": 0.85
    },
    "dag-warrior": {
        "maxHp": 100, "maxEnergy": 100, "energyRegen": 20, # NERFED HP -5
        "damageModifiers": {"punch": 1.05, "kick": 1.05, "special": 1.05},
        "blockEffectiveness": 0.55, "specialCostModifier": 1.0
    },
    "block-bruiser": {
        "maxHp": 115, "maxEnergy": 90, "energyRegen": 20,
        "damageModifiers": {"punch": 1.0, "kick": 1.2, "special": 1.0},
        "blockEffectiveness": 0.45, "specialCostModifier": 1.25
    },
    "hash-hunter": {
        "maxHp": 98, "maxEnergy": 105, "energyRegen": 20, # NERFED Regen -2
        "damageModifiers": {"punch": 1.0, "kick": 1.1, "special": 1.2},
        "blockEffectiveness": 0.65, "specialCostModifier": 1.0
    },

    # == COMMON (150) == TARGET: ~1.70
    "neon-wraith": {
        "maxHp": 92, "maxEnergy": 120, "energyRegen": 25, # BUFFED HP +2
        "damageModifiers": {"punch": 1.1, "kick": 1.1, "special": 1.15}, 
        "blockEffectiveness": 0.45, "specialCostModifier": 0.9 # BUFFED Block +0.05
    },
    "heavy-loader": {
        "maxHp": 135, "maxEnergy": 70, "energyRegen": 15, # BUFFED HP +5
        "damageModifiers": {"punch": 1.1, "kick": 1.0, "special": 1.0},
        "blockEffectiveness": 0.4, "specialCostModifier": 1.3 # BUFFED Block +0.05
    },
    "cyber-paladin": {
        "maxHp": 115, "maxEnergy": 95, "energyRegen": 20, # BUFFED HP +5
        "damageModifiers": {"punch": 1.05, "kick": 1.05, "special": 1.05}, # BUFFED Special +0.05
        "blockEffectiveness": 0.6, "specialCostModifier": 1.0
    },
    "razor-bot-7": {
        "maxHp": 95, "maxEnergy": 100, "energyRegen": 22, # BUFFED Regen +2
        "damageModifiers": {"punch": 1.05, "kick": 1.05, "special": 1.3}, 
        "blockEffectiveness": 0.5, "specialCostModifier": 1.0
    },

    # == RARE (800) == TARGET: ~1.90
    "kitsune-09": {
        "maxHp": 95, "maxEnergy": 110, "energyRegen": 22, 
        "damageModifiers": {"punch": 1.05, "kick": 1.1, "special": 1.1}, 
        "blockEffectiveness": 0.7, "specialCostModifier": 0.9
    },
    "gene-smasher": {
        "maxHp": 115, "maxEnergy": 90, "energyRegen": 20, # NERFED HP -5
        "damageModifiers": {"punch": 1.25, "kick": 1.25, "special": 1.1},
        "blockEffectiveness": 0.25, "specialCostModifier": 1.0
    },
    "nano-brawler": {
        "maxHp": 95, "maxEnergy": 105, "energyRegen": 22,
        "damageModifiers": {"punch": 1.2, "kick": 1.0, "special": 1.1},
        "blockEffectiveness": 0.45, "specialCostModifier": 1.0
    },
    "sonic-striker": {
        "maxHp": 105, "maxEnergy": 100, "energyRegen": 18, # BUFFED HP +5 to maintain avg
        "damageModifiers": {"punch": 1.15, "kick": 1.15, "special": 1.0}, 
        "blockEffectiveness": 0.5, "specialCostModifier": 1.0
    },

    # == EPIC (1500) == TARGET: ~2.10
    "viperblade": {
        "maxHp": 105, "maxEnergy": 100, "energyRegen": 23, # BUFFED HP +5, Regen +1
        "damageModifiers": {"punch": 1.15, "kick": 1.15, "special": 1.1}, # BUFFED Special +0.05
        "blockEffectiveness": 0.6, "specialCostModifier": 1.0 
    },
    "bastion-hulk": {
        "maxHp": 120, "maxEnergy": 115, "energyRegen": 20, # BUFFED HP +10
        "damageModifiers": {"punch": 1.0, "kick": 1.0, "special": 1.1},
        "blockEffectiveness": 0.85, "specialCostModifier": 0.9 # BUFFED Block +0.05
    },
    "technomancer": {
        "maxHp": 95, "maxEnergy": 120, "energyRegen": 25,
        "damageModifiers": {"punch": 0.95, "kick": 0.95, "special": 1.25}, # NERFED Special
        "blockEffectiveness": 0.55, "specialCostModifier": 0.85 # NERFED Cost
    },
    "prism-duelist": {
        "maxHp": 100, "maxEnergy": 110, "energyRegen": 22, # BUFFED HP +5, Energy +5
        "damageModifiers": {"punch": 1.05, "kick": 1.05, "special": 1.2}, # BUFFED Special +0.05
        "blockEffectiveness": 0.75, "specialCostModifier": 0.9 # BUFFED Block +0.05
    },

    # == LEGENDARY (2500) == TARGET: ~2.35
    "chrono-drifter": {
        "maxHp": 120, "maxEnergy": 105, "energyRegen": 22, # BUFFED
        "damageModifiers": {"punch": 1.1, "kick": 1.1, "special": 1.25}, # BUFFED
        "blockEffectiveness": 0.65, "specialCostModifier": 1.0 
    },
    "scrap-goliath": {
        "maxHp": 115, "maxEnergy": 80, "energyRegen": 25, 
        "damageModifiers": {"punch": 1.1, "kick": 1.1, "special": 1.1},
        "blockEffectiveness": 0.5, "specialCostModifier": 1.1 
    },
    "aeon-guard": {
        "maxHp": 120, "maxEnergy": 120, "energyRegen": 24, # BUFFED
        "damageModifiers": {"punch": 1.1, "kick": 1.1, "special": 1.2}, # BUFFED
        "blockEffectiveness": 0.65, "specialCostModifier": 1.0 
    },
    "void-reaper": {
        "maxHp": 95, "maxEnergy": 120, "energyRegen": 22, 
        "damageModifiers": {"punch": 1.25, "kick": 1.25, "special": 1.25}, 
        "blockEffectiveness": 0.35, "specialCostModifier": 1.0 
    }
}

# Price Data (updated)
PRICES = {
    # Free (Legacy)
    "cyber-ninja": 0, "dag-warrior": 0, "block-bruiser": 0, "hash-hunter": 0,
    
    # Common (150)
    "neon-wraith": 150, "heavy-loader": 150, "cyber-paladin": 150, "razor-bot-7": 150,
    
    # Rare (800)
    "kitsune-09": 800, "gene-smasher": 800, "nano-brawler": 800, "sonic-striker": 800,
    
    # Epic (1500)
    "viperblade": 1500, "bastion-hulk": 1500, "technomancer": 1500, "prism-duelist": 1500,
    
    # Legendary (2500)
    "chrono-drifter": 2500, "scrap-goliath": 2500, "aeon-guard": 2500, "void-reaper": 2500,
}

data = []

for name, stats in CHARACTERS.items():
    # Calculate derived stats
    
    # 1. Damage Output
    punch_dmg = BASE_MOVE_STATS["punch"]["damage"] * stats["damageModifiers"]["punch"]
    kick_dmg = BASE_MOVE_STATS["kick"]["damage"] * stats["damageModifiers"]["kick"]
    special_dmg = BASE_MOVE_STATS["special"]["damage"] * stats["damageModifiers"]["special"]
    
    # 2. Costs
    special_cost = BASE_MOVE_STATS["special"]["energyCost"] * stats["specialCostModifier"]
    
    # 3. Efficiency (Damage per Energy)
    kick_dpe = kick_dmg / 25.0
    special_dpe = special_dmg / special_cost
    
    # 4. Effective HP (EHP)
    # 0.8 means 80% reduction (Strong).
    block_strength = stats["blockEffectiveness"]
    
    # 5. Energy Economy
    turns_to_charge_special = special_cost / stats["energyRegen"]
    
    # 6. Combo Potential (Burst)
    avg_dmg_mod = (stats["damageModifiers"]["punch"] + stats["damageModifiers"]["kick"] + stats["damageModifiers"]["special"]) / 3
    
    row = {
        "Name": name,
        "Price": PRICES.get(name, 0),
        "HP": stats["maxHp"],
        "Energy": stats["maxEnergy"],
        "Regen": stats["energyRegen"],
        "Punch Dmg": punch_dmg,
        "Kick Dmg": kick_dmg,
        "Special Dmg": special_dmg,
        "Special Cost": special_cost,
        "Special DPE": special_dpe,
        "Block Str": block_strength,
        "Turns to Special": turns_to_charge_special,
        "Avg Dmg Mod": avg_dmg_mod
    }
    data.append(row)

df = pd.DataFrame(data)

# Normalize columns (exclude Price for score calculation, but map it for comparison)
cols_to_norm = ["HP", "Avg Dmg Mod", "Regen", "Block Str", "Special DPE", "Special Dmg"]
normalized_df = df.copy()

for col in cols_to_norm:
    normalized_df[col] = (df[col] - df[col].min()) / (df[col].max() - df[col].min())

# Calculate Power Score
normalized_df["Power Score"] = (
    normalized_df["HP"] * 1.0 +
    normalized_df["Avg Dmg Mod"] * 1.5 +
    normalized_df["Regen"] * 0.8 +
    normalized_df["Block Str"] * 0.5 +
    normalized_df["Special DPE"] * 1.0
)

df["Power Score"] = normalized_df["Power Score"]

# Group by Price Tier and calculate average score
tier_stats = df.groupby("Price")["Power Score"].mean()
print("\n--- Current Power by Price Tier ---")
print(tier_stats)

# Calculate desired progression for scaling verification
# e.g. Free (1.6) -> Legendary (2.3)
print("\n--- Spread Analysis ---")
min_score = df["Power Score"].min()
max_score = df["Power Score"].max()
print(f"Min Score: {min_score:.2f}")
print(f"Max Score: {max_score:.2f}")
print(f"Spread: {max_score - min_score:.2f}")

result = df.sort_values(by=["Price", "Power Score"], ascending=[True, False])

with open("balance_report.txt", "w") as f:
    f.write(result.to_string(float_format="%.2f"))
    f.write("\n\n--- Power by Price Tier ---\n")
    f.write(tier_stats.to_string(float_format="%.2f"))
    f.write(f"\n\nMin Score: {min_score:.2f}, Max Score: {max_score:.2f}, Spread: {max_score - min_score:.2f}")
