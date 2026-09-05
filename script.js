// گالری کارت‌ها را از HTML پیدا می‌کنیم
const bandsContainer = document.getElementById("bands-container");
/* console.log("Gallery:", bandsContainer);
console.log("Cards:", document.querySelectorAll(".card").length); */
// لیست گروه‌های موسیقی را نگه می‌دارد
// بعداً هر گروه جدید را فقط به همین لیست اضافه می‌کنیم
const bands = [
  {
    name: "Metallica",
    image: "Images/14.jpg",
    quote: '"The music is our sacred ritual."',
    genre: "Thrash Metal",
    year: "Since 1981",
  },
  {
    name: "Slayer",
    image: "Images/3.jpg",
    quote: '"Riffs that cut like blades."',
    genre: "Thrash Metal",
    year: "Since 1981",
  },
  {
    name: "Death",
    image: "Images/13.jpg",
    quote: '"The sound of rebellion."',
    genre: "Death Metal",
    year: "Since 1983",
  },
  {
    name: "Iron Maiden",
    image: "Images/20.jpg",
    quote: '"The legends of heavy metal."',
    genre: "Heavy Metal",
    year: "Since 1980",
  },
  {
    name: "Black Sabbath",
    image: "Images/4.jpg",
    quote: '"The pioneers of darkness."',
    genre: "Heavy Metal",
    year: "Since 1968",
  },
  {
    name: "Judas Priest",
    image: "Images/22.jpeg",
    quote: '"The metal gods."',
    genre: "Heavy Metal",
    year: "Since 1969",
  },
  {
    name: "Pantera",
    image: "Images/5.jpg",
    quote: '"The groove of aggression."',
    genre: "Groove Metal",
    year: "Since 1986",
  },
  {
    name: "Megadeth",
    image: "Images/16.jpg",
    quote: '"The thrash titans."',
    genre: "Thrash Metal",
    year: "Since 1983",
  },
  {
    name: "Slipknot",
    image: "Images/6.jpeg",
    quote: '"The masked chaos."',
    genre: "Nu Metal",
    year: "Since 1995",
  },
  {
    name: "Korn",
    image: "Images/17.jpg",
    quote: '"The pioneers of nu metal."',
    genre: "Nu Metal",
    year: "Since 1995",
  },
  {
    name: "Rammstein",
    image: "Images/21.jpg",
    quote: '"The industrial fire."',
    genre: "Industrial Metal",
    year: "Since 1994",
  },
  {
    name: "System of a Down",
    image: "Images/18.jpg",
    quote: '"The political metal."',
    genre: "Alternative Metal",
    year: "Since 1994",
  },
  {
    name: "Avenged Sevenfold",
    image: "Images/7.jpeg",
    quote: '"The melodic metal."',
    genre: "Alternative Metal",
    year: "Since 1999",
  },
  {
    name: "Tool",
    image: "Images/8.png",
    quote: '"The progressive metal."',
    genre: "Progressive Metal",
    year: "Since 1990",
  },
  {
    name: "Opeth",
    image: "Images/19.jpg",
    quote: '"The masters of progressive death metal."',
    genre: "Progressive Death Metal",
    year: "Since 1990",
  },
  {
    name: "Dream Theater",
    image: "Images/9.png",
    quote: '"The virtuosos of progressive metal."',
    genre: "Progressive Metal",
    year: "Since 1985",
  },
  {
    name: "Linkin Park",
    image: "Images/10.jpeg",
    quote: '"The nu metal revolution."',
    genre: "Nu Metal",
    year: "Since 1996",
  },
  {
    name: "Radiohead",
    image: "Images/20.jpg",
    quote: '"The experimental rockers."',
    genre: "Alternative Rock",
    year: "Since 1989",
  },
  {
    name: "Nirvana",
    image: "Images/11.jpg",
    quote: '"The grunge pioneers."',
    genre: "Grunge",
    year: "Since 1987",
  },
  {
    name: "Pearl Jam",
    image: "",
    quote: '"The voice of a generation."',
    genre: "Grunge",
    year: "Since 1990",
  },
  {
    name: "The Beatles",
    image: "",
    quote: '"The legends of rock."',
    genre: "Rock",
    year: "Since 1960",
  },
  {
    name: "Queen",
    image: "",
    quote: '"The champions of rock."',
    genre: "Rock",
    year: "Since 1970",
  },
  {
    name: "Led Zeppelin",
    image: "",
    quote: '"The gods of rock."',
    genre: "Rock",
    year: "Since 1968",
  },
  {
    name: "AC/DC",
    image: "",
    quote: '"The rock legends."',
    genre: "Hard Rock",
    year: "Since 1973",
  },
  {
    name: "Guns N' Roses",
    image: "Images/12.png",
    quote: '"The rock rebels."',
    genre: "Hard Rock",
    year: "Since 1985",
  },
  {
    name: "Foo Fighters",
    image: "",
    quote: '"The rock survivors."',
    genre: "Alternative Rock",
    year: "Since 1994",
  },
  {
    name: "The Rolling Stones",
    image: "",
    quote: '"The rock legends."',
    genre: "Rock",
    year: "Since 1962",
  },
  {
    name: "Deep Purple",
    image: "",
    quote: '"The pioneers of hard rock."',
    genre: "Hard Rock",
    year: "Since 1968",
  },
  {
    name: "Deftones",
    image: "",
    quote: '"The alternative rockers."',
    genre: "Alternative Rock",
    year: "Since 1990",
  },
  {
    name: "The Who",
    image: "",
    quote: '"The rock legends."',
    genre: "Rock",
    year: "Since 1964",
  },
  {
    name: "The Doors",
    image: "",
    quote: '"The psychedelic rockers."',
    genre: "Psychedelic Rock",
    year: "Since 1965",
  },
  {
    name: "Rage Against the Machine",
    image: "",
    quote: '"The anti-establishment rockers."',
    genre: "Alternative Rock",
    year: "Since 1991",
  },
];

bands.forEach((band) => {
  const bandsContainer = document.getElementById("bands-container");
  const newCard = document.createElement("div");
  newCard.classList.add("card");
  // یک تگ img برای عکس گروه می‌سازیم
  const bandImage = document.createElement("img");

  // مسیر عکس را از Object همان گروه می‌گیریم
  bandImage.src = band.image;

  // متن جایگزین عکس را از اسم گروه می‌سازیم
  bandImage.alt = band.name;

  // کلاس band-img را اضافه می‌کنیم
  // CSS فعلی ظاهر عکس را با همین کلاس کنترل می‌کند
  bandImage.classList.add("band-img");

  // عکس را داخل کارت قرار می‌دهیم
  newCard.appendChild(bandImage);
  // یک تگ h3 برای اسم گروه می‌سازیم
  const bandName = document.createElement("h3");

  // اسم گروه را از Object می‌گیریم
  bandName.textContent = band.name;

  // اسم گروه را داخل کارت قرار می‌دهیم
  newCard.appendChild(bandName);
  // یک تگ <p> برای جمله گروه می‌سازیم
  const bandQuote = document.createElement("p");

  // متن Quote را از Object گروه می‌گیریم
  bandQuote.textContent = band.quote;

  // کلاس quote را اضافه می‌کنیم
  // CSS فعلی ظاهر این متن را کنترل می‌کند
  bandQuote.classList.add("quote");

  // Quote را داخل کارت قرار می‌دهیم
  newCard.appendChild(bandQuote);
  // یک تگ <p> برای اطلاعات گروه می‌سازیم
  const bandInfo = document.createElement("p");

  // ژانر و سال را از Object گروه می‌گیریم
  bandInfo.textContent = `${band.genre} | ${band.year}`;

  // کلاس info را اضافه می‌کنیم
  // CSS فعلی ظاهر این بخش را کنترل می‌کند
  bandInfo.classList.add("info");

  // اطلاعات را داخل کارت قرار می‌دهیم
  newCard.appendChild(bandInfo);
  // یک تگ <a> برای لینک Biography می‌سازیم
  const bioLink = document.createElement("a");

  // متن لینک را مشخص می‌کنیم
  bioLink.textContent = "View Biography";

  // مسیر Biography را از Object گروه می‌گیریم
  bioLink.href = band.bio;

  // کلاس Bio را اضافه می‌کنیم
  // CSS فعلی ظاهر این لینک را کنترل می‌کند
  bioLink.classList.add("Bio");

  // لینک را داخل کارت قرار می‌دهیم
  newCard.appendChild(bioLink);
  bandsContainer.appendChild(newCard);
});
