
const openSubscriptionModal = (type) => {
  const planName = document.getElementById("planName");
  const planInput = document.getElementById("planInput");
  //console.log("openModal", type)
  if(type === "bronze") {
    planName.textContent = "Bronze plan / 50$ valid for 90 days";
    planInput.value = "bronze";
  } else if(type === "gold") {
    planName.textContent = "Gold plan / 100$ valid for 180 days";
    planInput.value = "gold";
  } else if(type === "platinum") {
    planName.textContent = "Platinum plan / 250$ valid for 365 days";
    planInput.value = "platinum";
  }
}


