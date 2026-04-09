const ShipBanner = () => {
  return (
    <div className="ship-banner" data-testid="ship-banner">
      <pre className="ascii-ship">
{`                                        |    |    |                 
                                       )_)  )_)  )_)              
                                      )___))___))___)\\            
                                     )____)____)_____)\\\\          
                                   _____|____|____|____\\\\\\__      
                          ~~~~~~~~\\                   /~~~~~~~~    
                            ~~~~~~\\_________________/~~~~~~       `}
      </pre>
    </div>
  );
};

export default ShipBanner;
