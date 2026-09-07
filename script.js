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
    image: "Images/13.png",
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
    image: "Images/11.png",
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

const bandsContainer = document.getElementById("bands-container");

if (bandsContainer) {
  const fragment = document.createDocumentFragment();
  const placeholder =
    'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="100%25" height="100%25" fill="%230a0a0a"/><text x="50%25" y="50%25" fill="%23ffffff" font-size="28" font-family="Arial" dominant-baseline="middle" text-anchor="middle">No Image</text></svg>';

  bands.forEach((band) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.band = band.name;

    const image = document.createElement("img");
    image.className = "band-img";
    image.alt = `${band.name} band`; 
    image.width = 400;
    image.height = 600;
    image.loading = "lazy";
    image.decoding = "async";
    image.src = band.image?.trim() ? band.image : placeholder;
    image.addEventListener("error", () => {
      if (image.src !== placeholder) {
        image.src = placeholder;
      }
    }, { once: true });
    card.appendChild(image);

    const name = document.createElement("h3");
    name.textContent = band.name;
    card.appendChild(name);

    const quote = document.createElement("p");
    quote.className = "quote";
    quote.textContent = band.quote;
    card.appendChild(quote);

    const info = document.createElement("p");
    info.className = "info";
    info.textContent = `${band.genre} | ${band.year}`;
    card.appendChild(info);

    const productsLink = document.createElement("a");
    productsLink.className = "Bio";
    productsLink.href = `index-shop.html?band=${encodeURIComponent(band.name)}`;
    productsLink.textContent = "Related Products";
    card.appendChild(productsLink);

    fragment.appendChild(card);
  });

  bandsContainer.replaceChildren(fragment);
}
