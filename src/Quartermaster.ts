import {Bot} from "mineflayer";
import {Entity} from 'prismarine-entity';
import {Item} from 'prismarine-item';
import damagePerSecond from './DamagePerSecond.json';

// TODO: handle target entity specific enchantments.
const calculateDamage = (item: Item, target: Entity): number => {
  return (<any>damagePerSecond)[item.name];
}

// TODO: don't include weapons that may break on next usage if option provided.
const getDamageByWeaponInInventory = (bot: Bot, target: Entity): Map<number, Array<Item>> => {
  const weaponNames = Object.keys(damagePerSecond);
  const weaponsInInventory = bot.inventory.slots.filter((itemInSlot) => itemInSlot != null && weaponNames.includes(itemInSlot.name));
  const weaponsByDamage = new Map();
  weaponsInInventory.forEach((item) => {
    const damage = calculateDamage(item, target);
    if (!weaponsByDamage.has(damage)) {
      weaponsByDamage.set(damage, []);
    }
    weaponsByDamage.get(damage).push(item);
  })
  return weaponsByDamage;
}

// TODO: maybe handle using a looting weapon
const getBestWeaponInInventory = (bot: Bot, target: Entity): Item | undefined => {
  const weaponsByDamage = getDamageByWeaponInInventory(bot, target);
  if (weaponsByDamage.size === 0) return;
  const maxDamage = Math.max(...weaponsByDamage.keys());
  const maxDamageItems = weaponsByDamage.get(maxDamage);
  if (maxDamageItems == null) return;
  const heldItemSlotId = bot.getEquipmentDestSlot('hand');
  const heldItemIfMaxDamage = maxDamageItems.find((item) => item.slot === heldItemSlotId);
  // Prefer to use the held item if it has the max damage value.
  if (heldItemIfMaxDamage != null) return heldItemIfMaxDamage;
  return maxDamageItems[0];
}

// Entity is provided for future use where calculating damage takes into account the entity and item enchantments
export const equipBestWeapon = async (bot: Bot, target: Entity) => {
  const bestWeapon = getBestWeaponInInventory(bot, target);
  if (bestWeapon == null) {
    // There isn't a good weapon in inventory.
    return;
  }
  if (bot.getEquipmentDestSlot('hand') === bestWeapon.slot) {
    // The best weapon is already in hand.
    return;
  }
  await bot.equip(bestWeapon, 'hand');
}
