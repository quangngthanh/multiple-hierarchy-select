const locationData = [
    {
        id: 1,
        name: "Vietnam",
        children: [
            {
                id: 101,
                name: "Hà Nội",
                children: [
                    { id: 1001, name: "Ba Đình" },
                    { id: 1002, name: "Hoàn Kiếm" },
                    { id: 1003, name: "Hai Bà Trưng" },
                    { id: 1004, name: "Đống Đa" },
                    { id: 1005, name: "Tây Hồ" }
                ]
            },
            {
                id: 102,
                name: "Hồ Chí Minh",
                children: [
                    { id: 1006, name: "Quận 1" },
                    { id: 1007, name: "Quận 3" },
                    { id: 1008, name: "Quận 4" },
                    { id: 1009, name: "Quận 5" },
                    { id: 1010, name: "Quận 7" }
                ]
            },
            {
                id: 103,
                name: "Đà Nẵng",
                children: [
                    { id: 1011, name: "Hải Châu" },
                    { id: 1012, name: "Thanh Khê" },
                    { id: 1013, name: "Sơn Trà" },
                    { id: 1014, name: "Ngũ Hành Sơn" }
                ]
            }
        ]
    },
    {
        id: 2,
        name: "Thailand",
        children: [
            {
                id: 201,
                name: "Bangkok",
                children: [
                    { id: 2001, name: "Phra Nakhon" },
                    { id: 2002, name: "Dusit" },
                    { id: 2003, name: "Nong Chok" }
                ]
            },
            {
                id: 202,
                name: "Chiang Mai",
                children: [
                    { id: 2004, name: "Mueang Chiang Mai" },
                    { id: 2005, name: "Chom Thong" },
                    { id: 2006, name: "Mae Chaem" }
                ]
            }
        ]
    },
    {
        id: 3,
        name: "Singapore",
        children: [
            {
                id: 301,
                name: "Central Region",
                children: [
                    { id: 3001, name: "Bishan" },
                    { id: 3002, name: "Toa Payoh" },
                    { id: 3003, name: "Novena" }
                ]
            },
            {
                id: 302,
                name: "East Region",
                children: [
                    { id: 3004, name: "Bedok" },
                    { id: 3005, name: "Tampines" },
                    { id: 3006, name: "Pasir Ris" }
                ]
            }
        ]
    }
];

// Example usage:
const industryData = [
    {
      id: 1,
      name: "Technology",
      children: [
        {
          id: 101,
          name: "Software Development",
        
        },
        {
          id: 102,
          name: "IT Services",
         
        },
        {
          id: 103,
          name: "Hardware",
       
        }
      ]
    },
    {
      id: 2,
      name: "Healthcare",
      children: [
        {
          id: 201,
          name: "Medical Services",
         
        },
        {
          id: 202,
          name: "Pharmaceuticals",
          
        },
        {
          id: 203,
          name: "Medical Equipment",
         
        }
      ]
    },
    {
      id: 3,
      name: "Financial Services",
      children: [
        {
          id: 301,
          name: "Banking",
          
        },
        {
          id: 302,
          name: "Insurance",
         
        },
        {
          id: 303,
          name: "Investment Services",
         
        }
      ]
    },
    {
      id: 4,
      name: "Manufacturing",
      children: [
        {
          id: 401,
          name: "Automotive",
        },
        {
          id: 402,
          name: "Consumer Goods",
        },
        {
          id: 403,
          name: "Industrial Equipment",
        }
      ]
    },
    {
      id: 5,
      name: "Energy",
      children: [
        {
          id: 501,
          name: "Renewable Energy",
        },
        {
          id: 502,
          name: "Oil & Gas",
        },
        {
          id: 503,
          name: "Utilities",
        }
      ]
    }
  ];
  