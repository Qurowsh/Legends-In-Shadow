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

// بهتر است یک بار container را بگیریم و سپس با DocumentFragment یک‌جا اضافه کنیم
const bandsContainer = document.getElementById("bands-container");
const fragment = document.createDocumentFragment();

// کوچک، درجا و بدون درخواست شبکه وقتی تصویر آماده نیست
const placeholder =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="100%25" height="100%25" fill="%230a0a0a"/><text x="50%25" y="50%25" fill="%23ffffff" font-size="28" font-family="Arial" dominant-baseline="middle" text-anchor="middle">No Image</text></svg>';

bands.forEach((band) => {
  const newCard = document.createElement("div");
  newCard.classList.add("card");

  // تصویر: اگر مسیر موجود است از آن استفاده می‌کنیم وگرنه placeholder
  const bandImage = document.createElement("img");
  bandImage.classList.add("band-img");
  bandImage.alt = band.name || "Band";
  bandImage.decoding = "async";
  bandImage.loading = "lazy";
  bandImage.src =
    band.image && band.image.trim() !== "" ? band.image : placeholder;
  if (!band.image || band.image.trim() === "") {
    bandImage.classList.add("no-image");
  }
  newCard.appendChild(bandImage);

  const bandName = document.createElement("h3");
  bandName.textContent = band.name;
  newCard.appendChild(bandName);

  const bandQuote = document.createElement("p");
  bandQuote.textContent = band.quote;
  bandQuote.classList.add("quote");
  newCard.appendChild(bandQuote);

  const bandInfo = document.createElement("p");
  bandInfo.textContent = `${band.genre} | ${band.year}`;
  bandInfo.classList.add("info");
  newCard.appendChild(bandInfo);

  const bioLink = document.createElement("a");
  bioLink.classList.add("Bio");
  if (band.bio) {
    bioLink.href = band.bio;
    bioLink.textContent = "View Biography";
  } else {
    bioLink.href = "#";
    bioLink.textContent = "Biography coming soon";
    bioLink.classList.add("disabled");
    bioLink.setAttribute("aria-disabled", "true");
  }
  newCard.appendChild(bioLink);

  fragment.appendChild(newCard);
});

bandsContainer.appendChild(fragment);
