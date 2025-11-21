let themes = [];

function setThemes(list){
  themes = list || [];
}

function getAll(){
  return themes.slice();
}

function getThemeById(id){
  return themes.find(t => (t.id && t.id.toString() === id.toString()) || t.name === id);
}

function getThemeByName(name){
  return themes.find(t => t.name === name);
}

module.exports = {
  setThemes,
  getAll,
  getThemeById,
  getThemeByName
};

